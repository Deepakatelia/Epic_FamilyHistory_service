import { Api} from '../../../dist/models';
import * as t from "../../../dist/api/familyHistory/types";
import * as v from "../../../dist/validation";
import { v4 } from "uuid";
import { Kafka, Partitioners } from "kafkajs";
import { nat_server } from "../../admin";
import { kafka_server } from "../../admin";
import { ModifiedMedicalHistorySchema, getFamilyHistoryfromEpic} from "./utils";
const kafka = new Kafka({
	clientId: "my-app",
	brokers: [kafka_server],
});
import { connect, StringCodec } from "nats";
import { TextEncoder } from "text-encoding";	

export class FamilyHistoryService {
	constructor() {
		this.getAll = this.getAll.bind(this);
		this.get = this.get.bind(this);
		this.create = this.create.bind(this);
		this.delete = this.delete.bind(this);
	}

	/* *
	 ! Todo: Implement pagination for this service
	*/
	async getAll(limit: number | undefined, sortByField: string | null | undefined): Promise<t.GetGetAllFamilyHistoryResponse> {
		try {
			const nc = await connect({ servers: nat_server });
			const sc = StringCodec();
			const data = {
				type: "getAll"
			}
			const ddata = JSON.stringify(data);
			const encoder = new TextEncoder();
			const enc = encoder.encode(ddata);
			const m = await nc.request("Epic-Familyhistory", enc, { timeout: 1000 });
			const natsOutput = JSON.parse(sc.decode(m.data));
			// console.log("natsOutput......",natsOutput);
			if (natsOutput == 404) {
				await nc.close();
				return {
					status: 404,
					body: { message: `No FamilyHistory found` },
				};
			} else {
				await nc.close();
				return {
					status: 200,
					body: {
						totalCount: natsOutput.length,
					    items: natsOutput,
					},
				};
			}
		} catch (error) {
			console.error(error);
			return {
				status: 404,
				body: { message: `something went wrong` },
			};
		}
	}

	async get(id: string): Promise<t.GetGetFamilyHistoryResponse> {
		try {
			const nc = await connect({ servers: nat_server });
			const sc = StringCodec();
			const data = {
				id: id,
				type: "get",
			};
			const ddata = JSON.stringify(data);
			const encoder = new TextEncoder();
			const enc = encoder.encode(ddata);
			const m = await nc.request("Epic-Familyhistory", enc, { timeout: 2000 });
			const natsOutput = JSON.parse(sc.decode(m.data));
			// console.log("natsOutput.....",natsOutput)
			if (natsOutput == "404") {
				await nc.close();
				return {
					status: 404,
					body: { message: `No Epic-Familyhistory found` },
				};
			} else {
				const FamilyHistory1 = JSON.parse(JSON.stringify(natsOutput));
				console.log({ FamilyHistory1 });
				await nc.close();
				return {
					status: 200,
					body: FamilyHistory1,
				};
			}
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("no-FamilyHistory-found")) {
				return {
					status: 404,
					body: {
						message: "No FamilyHistory found with given FamilyhistoryId",
					},
				};
			}
			return {
				status: 404,
				body: { message: `something went wrong` },
			};
		}
	}

	async create(uId: string): Promise<t.PostFamilyHistoryRegisterResponse> {
		try {
			if (!uId) {
			  return {
				status: 404,
				body: { message: `Invalid uId passed` },
			  };
			}
			const response = await getFamilyHistoryfromEpic(uId);

			if (response.status === 200) {
			  try {
				const producer = kafka.producer({
				  createPartitioner: Partitioners.DefaultPartitioner,
				});
				await producer.connect();
				const modifiedSchema :any = await ModifiedMedicalHistorySchema(response.data.entry);
				const FamilyHistory: Api.FamilyHistoryDto[] = modifiedSchema.map((item: any) =>
				v.modelApiFamilyHistoryDtoFromJson("FamilyHistory", item)
			);
				const ongoingmessage = {
					key: `create#$`,
					value: JSON.stringify(FamilyHistory),
				};
				await producer.send({
					topic: "Epic-Familyhistory",
					messages: [ongoingmessage],
				});
				
				return {
				  status: 201,
				  body:{
					totalCount: FamilyHistory.length,
					items: FamilyHistory,
				  }
				};
			  } catch (error: any) {
				if (error.toString().match("no-id-found")) {
				  throw new Error("no-id-found");
				}
				throw error;
			  }
			} else {
			  return {
				status: 404,
				body: { message: `No Familyhistory Family history found` },
			  };
			}
		  } catch (error) {
			console.log(error)
			return {
			  status: 404,
			  body: { message: `Internal Server Error` },
			};
		  }
		}
	async delete(id: string): Promise<t.DeleteDeleteFamilyHistoryResponse> {
		try {
			const CheckHistory = await this.get(id);
			if (CheckHistory.status == 404) {
				throw new Error("no-FamilyHistory-found");
			}
			if (CheckHistory.status === 200) {
				const producer = kafka.producer({
					createPartitioner: Partitioners.DefaultPartitioner,
				});
				await producer.connect();
				const data = CheckHistory.body;
				data.isExist = false;
				const outgoingMessage = {
					key: `delete#${id.toString()}`,
					value: JSON.stringify({
						...data,
						updatedAt: new Date().toISOString(),
					}),
				};
				await producer.send({
					topic: "Epic-Familyhistory",
					messages: [outgoingMessage],
				});
				return {
					status: 200,
					body: {
						message: `FamilyhistoryId deleted successfully`,
					},
				};
			}
			throw new Error("something-went-wrong");
		} catch (error: any) {
			console.error(error?.response?.status);
			return {
				status: 404,
				body: {
					message: "FamilyhistoryId already deleted or no FamilyhistoryId found",
				},
			};
		}
	}
}
