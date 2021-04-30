const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
import { asyncExecute } from "./compiler/terminal";
import generateConfig from "./compiler";
import { auth } from "./firebaseConfig";
import meta from "./package.json";
import { commandErrorHandler, logErrorToDB } from "./utils";
import firebase from "firebase-admin";

const main = async (projectId, configPath) => {
  console.log("configPath:", configPath);

  let user: firebase.auth.UserRecord;
  const success = await generateConfig(configPath, user);

  console.log("generateConfig done");

  // await asyncExecute('nvm use 14',()=>{});
  // await asyncExecute(
  //   `cd functions; \
  //    yarn install`,
  //    ()=>{}
  // );

  // await asyncExecute(
  //   `cd functions; \
  //      yarn deployFT \
  //       --project ${projectId} \
  //       --only functions`,
  //       ()=>{}
  // );

  // console.log("build complete");
};

main("antler-vc", "/_FIRETABLE_/settings/schema/test");