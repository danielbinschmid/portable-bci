import torch.nn as nn
import torch
from torch.autograd import Variable


class LSTM(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, seq_length, dropout):
        super(LSTM, self).__init__()
        self.num_layers = num_layers
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.seq_length = seq_length
        if num_layers > 1:
            drop = dropout
        else:
            drop = 0
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=drop,
        )

    def forward(self, x):
        h_0 = Variable(torch.zeros(self.num_layers, x.size(0), self.hidden_size))

        c_0 = Variable(torch.zeros(self.num_layers, x.size(0), self.hidden_size))

        # Propagate input through LSTM
        ula, (h_out, _) = self.lstm(x, (h_0, c_0))
        # h_out: torch.Tensor = h_out
        # h_out = h_out.view(-1, self.hidden_size)
        return h_out[-1]
