import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { StargateClient, GasPrice, coin } from "@cosmjs/stargate";
import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";

import fs from "fs";

const rpc = "https://rpc.xion-testnet-1.burnt.com:443";



const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
  prefix: "xion",
});

process.stdout.write(wallet.mnemonic);

const [account] = await wallet.getAccounts();

console.log("accouint is", account);

const client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet, {
  gasPrice: GasPrice.fromString("0.001uxion"),
});

let counterIds = 2083;
let counterAddress =
  "xion194rhhrh92tya3fcf26axk3lxnmwxgexjwk8mpztn8rvxuzzr8qvq93xe0c";

async function save() {
  const wasmFile = fs.readFileSync("./cw_counter.wasm");
  const wasmByteArray = new Uint8Array(wasmFile);
  const uploadResult = await client.upload(
    account.address,
    wasmByteArray,
    "auto"
  );
  console.log("contract id is", uploadResult.codeId);
  faucetId = uploadResult.codeId;
}

async function instantiate() {
  let insMSg = {
    count: "0",
    owner: account.address
  };

  let insReply = await client.instantiate(
    account.address,
    counterIds,
    insMSg,
    "XionCounter",
    "auto"
  );

  console.log("contract address is", insReply.contractAddress);
}

async function increment() {
  let incMsg = {
    increment_counter: {},
  };

  let incReply = await client.execute(
    account.address,
    counterAddress,
    incMsg,
    "auto"
  );

  console.log("increment sucessfull", incReply.transactionHash);
}


async function dicrement() {
  let dicMsg = {
    dicrement_counter: {},
  };

  let dicReply = await client.execute(
    account.address,
    counterAddress,
    dicMsg,
    "auto"
  );

  console.log("dicrement sucessfull", dicReply.transactionHash);
}

async function getConfig() {
  let getConfiMsg = {
    get_config: {},
  };

  let getConfigRes = await client.queryContractSmart(counterAddress, getConfiMsg);

  console.log("query sucessfull", getConfigRes);
}


