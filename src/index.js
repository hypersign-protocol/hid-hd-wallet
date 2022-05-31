const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { HIDNODE_REST, HIDNODE_FAUCET, HIDNODE_RPC } = require('./hsConstants');
const { SigningStargateClient } = require('@cosmjs/stargate');

const axios = require('axios');
module.exports = class HIDWallet {
    constructor({ hidNodeRPCUrl, hidNodeRestUrl, hidNodeFaucet = '' }) {
        this.prefix = 'hid';
        this.hidNodeRPCUrl = hidNodeRPCUrl && hidNodeRPCUrl != '' ? this.sanitizeUrl(hidNodeRPCUrl) : HIDNODE_RPC;
        this.hidNodeRestUrl = hidNodeRestUrl && hidNodeRestUrl != '' ? this.sanitizeUrl(hidNodeRestUrl) : HIDNODE_REST;
        this.hidNodeFaucet = hidNodeFaucet && hidNodeFaucet != '' ? this.sanitizeUrl(hidNodeFaucet) : HIDNODE_FAUCET;
        this.offlineSigner = null;
    }

    sanitizeUrl(url) {
        if (url && url.endsWith('/')) {
            return url.substring(0, url.length - 1);
        } else return url;
    }

    async generateWallet({ mnemonic }) {
        if (!mnemonic) {
            this.offlineSigner = await DirectSecp256k1HdWallet.generate(24, {
                prefix: this.prefix,
            });
        } else {
            this.offlineSigner = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                prefix: this.prefix,
            });
        }
    }

    /**
     * Get first wallet address of signer
     * @returns walletAddrss {string}
     */
    async getWalletAddress() {
        const accounts = await this.offlineSigner.getAccounts();
        this.walletAddress = accounts[0].address;
        return this.walletAddress;
    }

    /**
     * Get 10000uhid from faucet
     **/
    async rechargeWallet() {
        const walletAddress = await this.getWalletAddress();
        const url = this.hidNodeRestUrl;
        const data = {
            address: walletAddress,
            coins: ['10000uhid'],
        };
        await axios.post(url, data);
        const balance = await this.getBalance();
        return balance;
    }

    /**
     * Get wallet HID balance of the current account
     * @returns walletBalance {string}
     */
    async getBalance() {
        const walletAddress = await this.getWalletAddress();
        const url = this.hidNodeRestUrl + '/cosmos/bank/v1beta1/balances/' + walletAddress;
        const res = await axios.get(url);

        if (!res || !res.data || !res.data.balances || res.data.balances.length == 0) {
            console.error('Could not fetch the balance for wallet ' + walletAddress);
            return {};
        }
        return res.data.balances;
    }

    async sendTokens({ recipient, amount }) {
        if (!this.offlineSigner) {
            throw new Error('Signer is not initialized');
        }
        const walletAddress = await this.getWalletAddress();
        const client = await SigningStargateClient.connectWithSigner(this.hidNodeRPCUrl, this.offlineSigner, {
            gasPrice: "0.0001uhid"
        });
        let message = {
                message: "",
                transactionHash: "",
                gasUsed: 0,
                gasWanted: 0,
                height: 0,
                error: ""
            }
            /// TODO: need to make the fee dynamic
        const result = await client.sendTokens(walletAddress, recipient, amount, 'auto', '');
        if (result && result.code == 0) {
            message.transactionHash = result.transactionHash
            message.gasUsed = result.gasUsed
            message.gasWanted = result.gasWanted
            message.height = result.height
            message.message = "Transaction successfull"
        } else {
            message.message = "Transaction failed"
            message.error = result.rawLog ? result.rawLog : "Transaction failed"
        }
        return message;
    }
}