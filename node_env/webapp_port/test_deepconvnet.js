import { DeepConvNet } from "../tools/deepconvnet/DeepConvNet";



export async function init() {
    const model = new DeepConvNet()

    await model.init();
    return model;
}

/**
 * 
 * @param {DeepConvNet} model 
 */
export async function warmUpPrediction(model) {
    const now = Date.now()
    const n = await model.warmUpPrediction()
    return Date.now() - now
}