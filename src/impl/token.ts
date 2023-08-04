import * as jwt from "jsonwebtoken";
import * as fs from "fs";
import { v4 } from "uuid";
import axios from "axios";

const headers = {
  "Content-Type": "application/x-www-form-urlencoded",
};
export async function getEpicToken() {
  var client_id = "991e4cd4-a401-405d-b397-dbcdda0d8f30";
  var message = {
    iss: client_id,
    sub: client_id,
    aud: "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token/",
    jti: v4(),
    iat: Math.round(Date.now()),
    exp: Math.round(new Date().getTime() / 1000) + 300,
  };
  var privateKey = fs.readFileSync("secrets/private.pem").toString();
  var sPayload = JSON.stringify(message);
  var token = jwt.sign(sPayload, privateKey, { algorithm: "RS384" });
  const response = await axios.post(
    "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token/",
    new URLSearchParams({
      grant_type: "client_credentials",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: token,
    }),
    {
      headers: headers,
    }
  );
  return response.data.access_token;
}
