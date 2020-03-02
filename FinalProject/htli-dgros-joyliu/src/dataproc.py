import random
from typing import Tuple, List, Dict, Union, TypeVar, Generic
import numpy as np
import attr

T = TypeVar('T')
EXAMPLES_TYPE = Tuple[List[T], ...]


def sample_data(
        data: EXAMPLES_TYPE,
        initial_zoom_level: float,
        max_zoom_level: float
) -> Tuple[Tuple[float, EXAMPLES_TYPE], ...]:
    """An implementation of Algorithm 1 from paper

    Returns the examples for every zoom level
    """
    data_sample = ScatterDatasetSampler(data)
    zoom_level = initial_zoom_level
    out_data = []
    while not data_sample.is_empty() and zoom_level < max_zoom_level:
        this_zoom_data = tuple([] for _ in data)
        while not data_sample.is_empty():
            # Select a trial sample from the most unfilled data class
            class_id, x = data_sample.sample_least_filled()
            r_matrix = build_r_matrix()
            pass_conflict = conflict_check(r_matrix, )
            if pass_conflict:
                this_zoom_data[class_id].append(x)
        out_data.append((zoom_level, this_zoom_data))
        zoom_level *= 2
    return tuple(out_data)


class ScatterDatasetSampler(Generic[T]):
    """A store for the scatter points which supports efficient random
    sampling of the 'least filled' point."""
    def __init__(
        self,
        data: EXAMPLES_TYPE
    ):
        # We keep a shuffled version of the data
        self._data = data
        for points in self._data:
            random.shuffle(points)
        # We need the original lengths so that we find fill rate
        self._original_lengths = [
            len(points) for points in self._data
        ]

    def get_fill_rate(self, class_ind) -> float:
        # TODO (DNGros): The paper says target length is dependent on our
        #   r matrix which we don't have yet. Kind of confusing...
        target_num_samples = self._original_lengths[class_ind]
        current_num_samples = self._original_lengths[class_ind] - len(self._data[class_ind])
        return current_num_samples / target_num_samples

    def get_least_filled_class_ind(self) -> int:
        return int(np.argmin([
            self.get_fill_rate(class_ind)
            for class_ind, _ in enumerate(self._data)
        ]))

    def sample_least_filled(self) -> Tuple[int, T]:
        """Samples a point from the least filled class. Note this removes
        the datapoint from the sampler"""
        least_filled_ind = self.get_least_filled_class_ind()
        least_filled_points = self._data[least_filled_ind]
        # Because we shuffle up front this will be a random point
        return least_filled_ind, least_filled_points.pop()

    def num_points(self):
        return sum(len(points) for points in self._data)

    def is_empty(self):
        return self.num_points() == 0


def get_kde():
    # TODO J0ey1iu
    pass


def build_r_matrix(data_point, zoom_level: float, kde_func):
    # TODO dngros
    raise NotImplemented


def conflict_check():
    # TODO dngros
    raise NotImplemented


