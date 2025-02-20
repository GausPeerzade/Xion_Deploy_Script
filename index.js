import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { StargateClient, GasPrice, coin } from "@cosmjs/stargate";
import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";

import fs from "fs";

const rpc = "https://rpc.xion-testnet-1.burnt.com:443";

const mnemonic = "";

const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
  prefix: "xion",
});

process.stdout.write(wallet.mnemonic);

const [account] = await wallet.getAccounts();

console.log("accouint is", account);

const client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet, {
  gasPrice: GasPrice.fromString("0.001uxion"),
});

let lpId = 1742;
const cw20Id = 1217;

let weth = "xion1dzjrpqgvgdjldrcycg6vmrsfduzj60tphwzvjy8m477lexxd7jgssuf9vh";
let lpPool = "xion1xk752hg0z4hydjq3vsj0q9ra338cewhhnm040ssxsp7xdt5zdhtq0vfxkj";

async function save() {
  const wasmFile = fs.readFileSync("./cw_counter.wasm");
  const wasmByteArray = new Uint8Array(wasmFile);
  const uploadResult = await client.upload(
    account.address,
    wasmByteArray,
    "auto"
  );
  console.log("contract id is", uploadResult.codeId);
  lpId = uploadResult.codeId;
}

async function instcw() {
  const cw_intanMsg = {
    name: "wETH",
    symbol: "wETH",
    decimals: 6,
    initial_balances: [
      {
        address: account.address,
        amount: "100000000000",
      },
    ],
    mint: {
      minter: account.address,
    },
  };

  const cwReply = await client.instantiate(
    account.address,
    cw20Id,
    cw_intanMsg,
    "wETH",
    "auto"
  );

  console.log("weth address is ", cwReply.contractAddress);
}

async function inst() {
  let instMsg = {
    token1_denom: { native: "uxion" },
    token2_denom: { cw20: weth },
    lp_token_code_id: cw20Id,
    owner: account.address,
    protocol_fee_recipient: account.address,
    protocol_fee_percent: "0.5",
    lp_fee_percent: "0.5",
  };

  let insReply = await client.instantiate(
    account.address,
    lpId,
    instMsg,
    "WETH-XION Pool",
    "auto"
  );

  console.log("lp address is ", insReply.contractAddress);
}

async function addLiq() {
  let approveMsg = {
    increase_allowance: {
      spender: lpPool,
      amount: "100000000",
    },
  };

  let approveReply = await client.execute(
    account.address,
    weth,
    approveMsg,
    "auto"
  );
  console.log("Approve Successfull");

  let addLiqMsg = {
    add_liquidity: {
      token1_amount: "10000",
      max_token2: "500",
      min_liquidity: "0",
    },
  };

  let funds = [coin(10000, "uxion")];
  let addReply = await client.execute(
    account.address,
    lpPool,
    addLiqMsg,
    "auto",
    "",
    funds
  );
}
addLiq();
