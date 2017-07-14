import {ConfigLoader} from "../src/ConfigLoader";
describe("ConfigLoader", () => {


    it("Should set from env variables", () => {
        const testObj = {
            sub: {
                data: 0
            }
        };
        process.env["sub-data"] = "2";
        ConfigLoader.loadBackendConfig(testObj);
        expect(testObj.sub.data).toEqual(<any>"2");
    });


});
