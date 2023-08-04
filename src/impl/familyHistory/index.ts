import { FamilyHistoryService } from "./impl";
import * as t from "../../../dist/api/familyHistory/types";

const service = new FamilyHistoryService();

export const FamilyHistoryApiServiceImpl: t.FamilyHistoryApi = {
	postFamilyHistoryRegister: service.create,
	deleteDeleteFamilyHistory: service.delete,
	getGetFamilyHistory: service.get,
	getGetAllFamilyHistory: service.getAll,
};
export {FamilyHistoryService}

