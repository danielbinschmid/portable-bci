import random

import matplotlib
import matplotlib.lines as mlines
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import matplotlib.ticker
import numpy as np

import us_cmap


def above_legend_args(ax):
    return dict(loc='lower center', bbox_to_anchor=(0.5, 1.0), bbox_transform=ax.transAxes, borderaxespad=0.25)


def add_single_row_legend(ax: matplotlib.pyplot.Axes, title: str, **legend_args):
    # Extracting handles and labels
    try:
        h, l = legend_args.pop('legs')
    except KeyError:
        h, l = ax.get_legend_handles_labels()
    ph = mlines.Line2D([], [], color='white')
    handles = [ph] + h
    labels = [title] + l
    legend_args['ncol'] = legend_args.get('ncol', len(handles))
    leg = ax.legend(handles, labels, **legend_args)
    for vpack in leg._legend_handle_box.get_children()[:1]:
        for hpack in vpack.get_children()[:1]:
            hpack.get_children()[0].set_width(-30)


def filter_duplicate_handles(ax):
    """
    usage:  ax.legend(*filter_duplicate_handles(ax), kwargs...)
    :param ax:
    :return:
    """

    handles, labels = ax.get_legend_handles_labels()
    unique = [(h, l) for i, (h, l) in enumerate(zip(handles, labels)) if l not in labels[:i]]
    return zip(*unique)


class MaxTickSciFormatter(matplotlib.ticker.Formatter):
    """
    Only formats ticks that are above a given maximum. Useful for log plots, where the last tick label is not shown.
    Usage: ax.yaxis.set_minor_formatter(MaxTickSciFormatter(last_tick_value))
    """

    def __init__(self, last_tick_value):
        """
        :param last_tick_value: format all labels with an x/y value equal or above this value
        """
        super().__init__()
        self.last_tick_value = last_tick_value
        self._sci_formatter = matplotlib.ticker.LogFormatterSciNotation()

    def __call__(self, x, pos=None):
        if x >= self.last_tick_value:
            return self._sci_formatter(x, pos)
        else:
            return ''


def get_dimensions(height=140, num_cols=1):
    # \showthe\columnwidth
    single_col_pts = 252
    double_col_pts = 516
    inches_per_pt = 1 / 72.27

    if num_cols == 1:
        width_inches = single_col_pts * inches_per_pt + 0.23  # added default matplotlib padding
    elif num_cols == 2:
        width_inches = double_col_pts * inches_per_pt + 0.23
    else:
        width_inches = single_col_pts * num_cols * inches_per_pt + 0.23

    height_inches = height * inches_per_pt
    return width_inches, height_inches


def prepare_matplotlib():
    us_cmap.activate()
    params = {
        'savefig.pad_inches': 0.0,
        'savefig.bbox': 'tight',
        'savefig.transparent': True,
        'font.family': 'Times New Roman',
        'font.size': 8,
        'xtick.labelsize': 8,
        'ytick.labelsize': 8,
        'axes.titlesize': 8,
        'axes.labelsize': 8,
        'legend.fontsize': 8,
        'figure.titlesize': 8,
        'figure.autolayout': True,
        'axes.labelweight': 'normal',
        'axes.titleweight': 'normal',
        'legend.columnspacing': 0.75,
        'legend.handlelength': 1,
        'legend.handletextpad': 0.2,
        'legend.frameon': False,
        'legend.borderpad': 0
    }
    matplotlib.rcParams.update(params)


def prepare_for_latex(preamble=''):
    if 'siunitx' not in preamble:
        preamble += '\n' + r'\usepackage{siunitx}'
    prepare_matplotlib()
    params = {
        'backend': 'pgf',
        'text.usetex': True,
        'text.latex.preamble': preamble,
        'pgf.texsystem': 'pdflatex',
        'pgf.rcfonts': False,
        'pgf.preamble': preamble,
        'axes.unicode_minus': False,
    }
    matplotlib.rcParams.update(params)


# \documentclass{article}
# \usepackage{layouts}
# \begin{document}
# \begin{figure*}
#   \currentpage\pagedesign
# \end{figure*}
# \end{document}