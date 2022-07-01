#include "main.h"
#include <json/json.hpp>
#include <fstream>
#include <stdexcept>
#include <cassert>
#include <geometry/Metrics.hpp>

using json = nlohmann::json;

void compareMeans(std::vector<std::pair<std::string, Eigen::MatrixXd>> means1, std::vector<std::pair<std::string, Eigen::MatrixXd>> means2) {
    double diff = 0;
    for (int i = 0; i < means1.size(); i++) {

        double* d1 = means1[i].second.data();
        double* d2 = means2[i].second.data();
        for (int j = 0; j < 16; j++) {
            diff += (d1[j] - d2[j]) * (d1[j] - d2[j]);
        }
    }

    std::cout << "difference in means: " << diff << "\n";
    assert(diff < 1);
}


void referenceDataRun()
{
    std::string globalDataPath = "/mnt/d/bachelor-thesis/cpp/NeuralInspiredUnit/Kernel/src/data/";
    // ---------- TEST --------------
    std::cout << "tun test"
              << "\n";
    std::string testfilepath = globalDataPath + "test.json";
    std::cout << "test json file buffer: "
              << "\n";
    std::ifstream testfile(testfilepath);
    std::cout << testfile.rdbuf() << "\n";

    // ---------- CONFIG -------------
    std::string filepath = globalDataPath + "subj_1.json";
    std::ifstream file(filepath);
    json training_data_json = json::parse(file)["train_data"];

    double sampleRate = 250.0;
    const int nBands = 43;
    const int filterOrder = 2;
    int nTrials = training_data_json.size(); // 1
    int nChannels = training_data_json[0].size();
    int nSteps = training_data_json[0][0].size();
    const int tShift = 125;
    nSteps -= tShift;

    RiemannKernel_d kernel;
    Timeseries_d timeseries(nChannels, nBands, sampleRate, 4 * sampleRate);


    std::cout << "(nTrials, nSteps, nChannels): " << nTrials << " " << nSteps << " " << nChannels << "\n";


    // ------------ SIMULATE LIVE APPLICATION BANDPASS FILTERING --------------
    
    for (int trialIdx = 0; trialIdx < nTrials; trialIdx++)
    { // through trials
        for (int t = 0; t < nSteps; t++)
        { // through timesteps
            double* timestep = new double[nChannels];
            for (int channelIdx = 0; channelIdx < nChannels; channelIdx++)
            {
                timestep[channelIdx] = training_data_json[trialIdx][channelIdx][t + tShift];
            }
            timeseries.addTimestep(timestep);
        }
        Timetensor_d tensor;
        timeseries.popAll(tensor);
        kernel.addTrial(tensor);
    }
    // -----------------------------------------------------------------------


    std::string filepath_hersche_labels = globalDataPath + "band_labels_hersche.json";
    std::string filepath_lookup = globalDataPath + "labels_lookup.json";

    std::ifstream file_hersche_labels(filepath_hersche_labels);
    std::ifstream file_lookup(filepath_lookup);

    json json_hersche_labels = json::parse(file_hersche_labels);
    json json_lookup = json::parse(file_lookup);

    // ------------------------ Riemannian mean ---------------------------

    std::cout << "Fit riemann kernel .."
              << "\n";
    
    ArrayBuffer_d tensors;
    kernel.fitTrials(tensors);

    std::cout << "fitted" << "\n";
    double *tensorData = (double *)tensors.data;

    // load hersche means
    std::string filepath_cov_means = globalDataPath + "cov_means.json";
    std::ifstream file_cov_means(filepath_cov_means);
    json json_cov_means = json::parse(file_cov_means)["data"];

    // convert json to mean data format
    std::vector<std::pair<std::string, Eigen::MatrixXd>> herscheMeans;
    herscheMeans.resize(nBands);
    for (int bandIdx = 0; bandIdx < nBands; bandIdx++)
    {
        int begin = (int)json_hersche_labels[bandIdx][0];
        int end = (int)json_hersche_labels[bandIdx][1];
        std::string label_id = std::to_string(begin) + "," + std::to_string(end);
        int ownIdx = json_lookup[label_id]["own"];
        
        double* matData= new double[nChannels * nChannels];
        for (int row = 0; row < nChannels; row++) {
            for (int col = 0; col < nChannels; col++) {
                matData[row * nChannels + col] = json_cov_means[bandIdx][row][col];
            }
        }
        Eigen::Map<Eigen::MatrixXd> mat(matData, nChannels, nChannels);
        herscheMeans[ownIdx] = std::pair<std::string, Eigen::MatrixXd>(label_id, mat);
    }  

    std::vector<std::pair<std::string, Eigen::MatrixXd>> ownMeans = kernel.means;

    // compare covs
    compareMeans(ownMeans, herscheMeans);


    // ------------------------ EVAL VECTORIZED RESULT --------------------------
    
    if (true) 
    {
        std::cout << "Evaluate vectorization .."
              << "\n";
        std::string filepath_eval = globalDataPath + "riemann_subj_1.json";

        std::ifstream file_eval(filepath_eval);
        json json_eval = json::parse(file_eval);
        json_eval = json_eval["riemann_data"]; // of shape (nTrials, 1, nBbands, nSteps)

        int vectorizedLength = 10;

        double diff = 0;
        for (int trialIdx = 0; trialIdx < nTrials; trialIdx++)
        {
            
            for (int bandIdx = 0; bandIdx < nBands; bandIdx++)
            {
                int begin = (int)json_hersche_labels[bandIdx][0];
                int end = (int)json_hersche_labels[bandIdx][1];
                std::string label_id = std::to_string(begin) + "," + std::to_string(end);
                int ownIdx = json_lookup[label_id]["own"];
                
                double predictedSum = 0;
                double truthSum = 0;
                for (int i = 0; i < vectorizedLength; i++)
                {
                    
                    predictedSum += tensorData[trialIdx * nBands * vectorizedLength + ownIdx * vectorizedLength + i];
                    double truth = json_eval[trialIdx][0][bandIdx][i];
                    truthSum += truth;
                    
                    
                }
                diff += (predictedSum - truthSum) * (predictedSum - truthSum);
                // std::cout << "computed: " << predicted << "; truth: " << truth << "\n";
                // std::cout << "------- total difference: " << diff << " for band idx: " << bandIdx << ", that is: " << ownIdx << "\n";
            }
        }
        std::cout << "------- total difference: " << diff << "\n";
        assert(diff < 0.1);
    }
    



    // ------------------- EVAL PREDICTION -------------------------
    for (int trialIdx = 0; trialIdx < nTrials; trialIdx++)
    { // through trials
        for (int t = 0; t < nSteps; t++)
        { // through timesteps
            double* timestep = new double[nChannels];
            for (int channelIdx = 0; channelIdx < nChannels; channelIdx++)
            {
                timestep[channelIdx] = training_data_json[trialIdx][channelIdx][t + tShift];
            }
            timeseries.addTimestep(timestep);
        }
        Timetensor_d tensor;
        timeseries.popAll(tensor);
        ArrayBuffer_d buf;
        kernel.apply(tensor, buf);
    }
}

void testTensorCaching() 
{
    std::cout << "eval tensor caching" << "\n";
    const long nChannels = 4;
    const long nBands = 13;
    const long sampleRate = 250; 
    const long expectedTimesteps = 1000;   

    Timeseries_d tSeries(nChannels, nBands, sampleRate, expectedTimesteps);

    const long nTrials = 10;
    const long nSteps = expectedTimesteps;

    std::cout << "creating timetensor" << "\n";
    for (int t = 0; t < nSteps; t++)
    { // through timesteps
        double* timestep = new double[nChannels];
        for (int channelIdx = 0; channelIdx < nChannels; channelIdx++)
        {
            timestep[channelIdx] = (double) (rand() % 100);
        }
        tSeries.addTimestep(timestep);
    }
    Timetensor_d tensor;
    tSeries.popAll(tensor);

    std::cout << "fetching buffer" << "\n";
    ArrayBuffer_d buf;
    tensor.getData(buf);

    double* refData =(double*) buf.data;
    
    std::cout << "reload buffer" << "\n";
    Timetensor_d loadedTensor;
    tSeries.loadCachedTensor(refData, nSteps, tensor.isCov, loadedTensor);
    
    std::cout << "fetch reloaded buffer" << "\n";
    ArrayBuffer_d loadBuf;
    loadedTensor.getData(loadBuf);
    double * loadData = (double*) loadBuf.data;

    std::cout << "start assertions" << "\n";

    assert(loadedTensor.isCov == tensor.isCov);
    assert(loadedTensor.length == tensor.length);
    assert(loadedTensor.nBands == tensor.nBands);
    assert(loadedTensor.nChannels == tensor.nChannels);
    assert(loadBuf.length == buf.length);

    double* d1 = (double*) buf.data;
    double* d2 = (double*) loadBuf.data;
    for (int i = 0; i < loadBuf.length; i++)
    {
        assert(refData[i] == loadData[i]);
    }

    std::cout << "assertions fulfilled" << "\n";
}

int main()
{   
    testTensorCaching();
    referenceDataRun();
}