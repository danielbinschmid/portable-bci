from tokenize import Double
from typing import Optional
import torch
from torch.utils.mobile_optimizer import optimize_for_mobile
import numpy as np
import random
from torch.autograd import Variable
from n_LSTM import LSTM
import sys
from n_ALRC import alrc


class OneDimCNNLSTM(torch.nn.Module):
    def __init__(
        self,
        num_classes=2,
        input_size=20,
        num_kernels=32,
        hidden_size=32,
        num_layers=2,
        num_windows=10,
    ) -> None:
        super(OneDimCNNLSTM, self).__init__()
        self.n_hidden = hidden_size
        self.num_windows = num_windows
        self.conv = torch.nn.Conv1d(input_size, num_kernels, 1)
        self.lstm = LSTM(
            input_size=num_kernels,
            hidden_size=hidden_size,
            num_layers=num_layers,
            seq_length=num_windows,
            dropout=0.1,
        )
        self.lin = torch.nn.Linear(hidden_size, num_classes)
        self.softmax = torch.nn.LogSoftmax(1)
        self.dropout = torch.nn.Dropout(0.1)

    def forward(self, x: torch.Tensor):
        """
        Requires x to be of shape (batch_size, features, num_windows)
        """
        x = self.conv(x)
        x = self.dropout(x)
        x = x.permute((0, 2, 1))
        x = self.lstm(x)
        x = self.dropout(x)
        x = self.lin(x)
        x = self.softmax(x)
        return x

    def fit(
        self,
        batches_list: list[tuple[torch.Tensor, torch.Tensor]],
        obs: int,
        epochs: int,
        learning_rate: float,
        loss_func,
        validation_set: Optional[list[tuple[torch.Tensor, torch.Tensor]]] = None,
    ) -> tuple[list[float], list[float]]:
        """
        Fits the Model to training data.

        @params
        - batches_list: list of xbatch, ybatch tuples
        - obs: number of training events
        
        @returns
        - batch_losses
        - validation losses: if validation_set is None, this is an empty list
        """
        self.train()
        # optimiser = torch.optim.Adam(self.parameters(), learning_rate, weight_decay=0.001)
        optimiser = torch.optim.Adam(self.parameters(), learning_rate)
        # optimiser = torch.optim.SGD(self.parameters(), learning_rate, weight_decay=0.0001)
        epoch = 0
        losses = []
        validation_losses = []
        current_mus = None
        while epoch < epochs:
            epoch += 1
            current_loss = 0
            batches = 0
            progress = 0
            for x_batch, y_batch in batches_list:
                batches += 1
                optimiser.zero_grad()
                y_hat = self.forward(x_batch)
                loss = loss_func(y_hat, y_batch)
                loss, current_mus = alrc(loss, current_mus)
                current_loss += (x_batch.size(0) / obs) * (loss.detach().item())
                loss.backward()
                # torch.nn.utils.clip_grad_norm_(self.parameters(), max_norm=0.5, norm_type=2)
                optimiser.step()
                progress += y_batch.size(0)
                sys.stdout.write(
                    "\rEpoch: %d, Progress: %d/%d, Loss: %f      "
                    % (epoch, progress, obs, current_loss)
                )
                sys.stdout.flush()
                x_batch.detach()
                y_batch.detach()
            losses.append(current_loss)
            if validation_set is not None:
                val_loss = 0
                for x, y in validation_set:
                    y_hat = self.forward(x)
                    val_loss_torch = loss_func(y_hat, y)
                    val_loss += val_loss_torch.detach().item()
                val_loss /= len(validation_set)
                validation_losses.append(val_loss)
        return losses, validation_losses


def debug():
    num_windows = 10
    features = 20
    time_series: np.ndarray = np.zeros((1, features, num_windows))
    for t in range(num_windows):
        for c in range(features):
            time_series[0, c, t] = random.random() * 100 - 50
    onedcnnlstm = OneDimCNNLSTM()
    onedcnnlstm.float()
    time_series_tensor: torch.Tensor = torch.from_numpy(time_series).float()
    result: torch.Tensor = onedcnnlstm.forward(time_series_tensor)
    print(result.detach().numpy())


def window_data(
    data: np.ndarray, window_size: float, overlap: float, frequency: int = 10
) -> np.ndarray:
    """
    data has shape (features, timepoints)
    """
    window_length = int(window_size * frequency)
    window_shift = int(overlap * window_length)
    start_idx = 0
    end_idx = window_length
    num_timepoints = len(data[0])
    windowed_data = [[] for feat in range(len(data))]
    while end_idx < num_timepoints:
        for feat in range(len(data)):
            w = 0
            for t in range(start_idx, end_idx + 1):
                w += data[feat][t]
            w = w / window_length
            windowed_data[feat].append(w)
        start_idx = start_idx + window_shift
        end_idx = end_idx + window_shift
    return np.asarray(windowed_data)


if __name__ == "__main__":
    debug()

"""
Adam optimizer 
'weight_decay' 
implements L2 regularizer
"""
