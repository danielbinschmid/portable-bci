"""
Implementation of adaptive learning rate clipping (ALRC).
Adapted from original Tensorflow implementation: https://github.com/Jeffrey-Ede/ALRC/blob/master/alrc.py

Paper:
Adaptive Learning Rate Clipping Stabilizes Learning
Jeffrey M. Ede1
and Richard Beanland
2019
"""

import torch
from typing import Optional


def alrc(
    loss,
    current_mus: Optional[tuple[torch.Tensor, torch.Tensor]] = None,
    num_stddev=1,
    decay=0.9,
    mu1_start=1,
    mu2_start=1.1 ** 2,
):
    """
    Implements adaptive learning rate clipping.
    """
    if current_mus is None:
        mu = torch.tensor(mu1_start, dtype=torch.float32)
        mu2 = torch.tensor(mu2_start, dtype=torch.float32)
    else:
        mu, mu2 = current_mus

    sigma = torch.sqrt(mu2 - mu ** 2 + 1.0e-8)
    Lmax: torch.Tensor = mu + num_stddev * sigma
    no_gradient: torch.Tensor = loss / Lmax
    no_gradient = no_gradient.detach()
    loss = torch.where(loss < mu + Lmax, loss, loss / no_gradient)
    mean_loss = torch.mean(loss)
    mean_loss2 = torch.mean(loss ** 2)
    update_mus: tuple[torch.Tensor, torch.Tensor] = (
        decay * mu + (1 - decay) * mean_loss,
        decay * mu2 + (1 - decay) * mean_loss2,
    )
    return loss, update_mus
