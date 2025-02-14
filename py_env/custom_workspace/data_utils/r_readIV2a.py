import scipy.io as sio
import numpy as np

def resample(nb_timesteps, target_frequency, windowlength_seconds):
    """
    data of shape (nb_trials, nb_channels, nb_timesteps)
    """
    target_nb_timesteps = int(target_frequency * windowlength_seconds)
    l = list(np.linspace(0, nb_timesteps - 1, target_nb_timesteps).astype(int))
    return l


def get_data(subject, training, PATH, class_vec=[1, 2, 3], trialtimerange=3.5, offset=2.5) -> tuple[np.ndarray, np.ndarray]:
    """	Loads the dataset 2a of the BCI Competition IV
	available on http://bnci-horizon-2020.eu/database/data-sets

	Keyword arguments:
	subject -- number of subject in [1, .. ,9]
	training -- if True, load training data
				if False, load testing data
	
	Return:	data_return 	numpy matrix 	size = NO_valid_trial x 22 x 1750
			class_return 	numpy matrix 	size = NO_valid_trial
	"""
    NO_channels = 22
    NO_tests = 6 * 48
    Window_Length = int(trialtimerange * 250)
    offset_length = int(offset * 250)

    class_return = np.zeros(NO_tests)
    data_return = np.zeros((NO_tests, NO_channels, Window_Length))

    NO_valid_trial = 0
    if training:
        a = sio.loadmat(PATH + "A0" + str(subject) + "T.mat")
    else:
        a = sio.loadmat(PATH + "A0" + str(subject) + "E.mat")
    a_data = a["data"]
    for ii in range(0, a_data.size):
        a_data1 = a_data[0, ii]
        a_data2 = [a_data1[0, 0]]
        a_data3 = a_data2[0]
        a_X = a_data3[0]
        a_trial = a_data3[1]
        a_y = a_data3[2]
        a_fs = a_data3[3]
        a_classes = a_data3[4]
        a_artifacts = a_data3[5]
        a_gender = a_data3[6]
        a_age = a_data3[7]
        for trial in range(0, a_trial.size):
            if a_artifacts[trial] == 0 and int(a_y[trial]) in class_vec:
                data_return[NO_valid_trial, :, :] = np.transpose(
                    a_X[
                        int(a_trial[trial]) + offset_length : (int(a_trial[trial]) + offset_length + Window_Length), :22
                    ]
                )
                class_return[NO_valid_trial] = int(a_y[trial])
                NO_valid_trial += 1

    d = data_return[0:int(NO_valid_trial), [1, 5, 13, 17]]
    d = d[:, :, resample(Window_Length, 128, trialtimerange)]
    return d, class_return[0:int(NO_valid_trial)]