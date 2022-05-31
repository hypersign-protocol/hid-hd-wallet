const HIDWallet = require('../../dist/hypersign-wallet-sdk');

const mnemonic =
    'retreat seek south invite fall eager engage endorse inquiry sample salad evidence express actor hidden fence anchor crowd two now convince convince park bag';

const walletOptions = {
    hidNodeRPCUrl: 'http://ec2-13-233-118-114.ap-south-1.compute.amazonaws.com:26657',
    hidNodeRestUrl: 'http://ec2-13-233-118-114.ap-south-1.compute.amazonaws.com:1317',
};

const hidWalletInstanceSender = new HIDWallet(walletOptions);
const hidWalletInstanceReceiver = new HIDWallet(walletOptions);

const amount = [{
    denom: 'uhid',
    amount: '1000',
}, ];

async function checkAllBalances({ hidWalletInstanceSender, hidWalletInstanceReceiver }) {
    const senderAddress = await hidWalletInstanceSender.getWalletAddress();
    const receieverAddress = await hidWalletInstanceReceiver.getWalletAddress();

    const senderAddressBal = await hidWalletInstanceSender.getBalance();
    const receieverAddressBal = await hidWalletInstanceReceiver.getBalance();

    console.log([{
            senderAddress,
            senderAddressBal: JSON.stringify(senderAddressBal),
        },
        {
            receieverAddress,
            receieverAddressBal: JSON.stringify(receieverAddressBal),
        },
    ]);
}

async function test() {
    if (!mnemonic) {
        throw new Error('mnemonic is not set');
    }
    await hidWalletInstanceSender.generateWallet({ mnemonic });
    await hidWalletInstanceReceiver.generateWallet({});

    await checkAllBalances({ hidWalletInstanceSender, hidWalletInstanceReceiver });

    const senderAddress = await hidWalletInstanceSender.getWalletAddress();
    const receieverAddress = await hidWalletInstanceReceiver.getWalletAddress();
    console.log('Sending ' + amount[0].amount + ' from ' + senderAddress + ' to ' + receieverAddress);


    console.log({ recipient: receieverAddress, amount })
    const res = await hidWalletInstanceSender.sendTokens({ recipient: receieverAddress, amount });

    console.log(res);

    await checkAllBalances({ hidWalletInstanceSender, hidWalletInstanceReceiver });
}

test();