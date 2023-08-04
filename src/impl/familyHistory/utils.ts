import axios from "axios";
import { Api } from "../../../dist/models";
import { getEpicToken } from "../token";
import {FamilyHistoryService} from "./impl";
import { v4 } from "uuid";
export async function getFamilyHistoryfromEpic(uId: string) {
  try {
    const access_token = await getEpicToken();
    console.log("token....",access_token)
    const headers = {
      Accept: "application/fhir+json",
      Authorization: "Bearer " + access_token
    };
    const response = await axios.get(
      process.env.EPIC_API + "/R4" + "/FamilyMemberHistory?patient="+ uId,
      {
        headers: headers,
      }
    );
    return response;
  } catch (error) {
    console.log("error.....",error)
    return {
      status: 404,
      data: {},
      body: { message: `No patient found` },
    };
  }
}

export async function ModifiedMedicalHistorySchema(data: any) {
  var Familyhistory: any[] = [];
  
  data.forEach(function (value: any,index:any) {
    console.log("condition...",value.resource.condition)
    const values: string[] = [];
    for (const item of value.resource.condition) {
      values.push(item.code.coding[1].display);
    }
    let response = {
      id: value.resource.id,
      Status: value.resource.status,
      resourceType: value.resource.resourceType,
      sex:value.resource.sex.coding[0].code,
      patientName: value.resource.patient.display,
      deceasedBoolean: value.resource.deceasedBoolean,
      patientId: value.resource.patient.reference.split('/')[1],
      relationship:"("+value.resource.relationship.coding[0].display+")"+value.resource.relationship.coding[1].display,
      isExist: true,
      Conditions: [...values],
    };
    Familyhistory.push(response);
  });
  return Familyhistory;
}


export async function capitalizeFirstLetter(str: string) {
  const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
  return capitalized;
}
