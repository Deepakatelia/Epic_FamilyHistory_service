import { FamilyHistoryApi } from "../../dist/api/familyHistory/types";
import { ApiImplementation } from "../../dist/types";
import { FamilyHistoryApiServiceImpl } from "./familyHistory";

export class ServiceImplementation implements ApiImplementation {
	familyHistory: FamilyHistoryApi=FamilyHistoryApiServiceImpl;
}
