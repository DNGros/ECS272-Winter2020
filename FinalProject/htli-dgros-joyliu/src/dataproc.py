import random
from typing import Tuple, List, Dict, Union, TypeVar, Generic
import numpy as np
import attr
from scipy import stats

from lib.dynamic_array import DynamicArray

COORD_TYPE = Union[Tuple[float, float], Tuple[float, float, float]]


class ScatterDataPoint:
    """
    A wrapper a point of data. When comparing points we compare memory address, not
    the actual coord value.
    """
    def __init__(
        self,
        class_id: int,
        coord: COORD_TYPE
    ):
        self._class_id = class_id
        self._coord = coord

    @property
    def coord(self) -> COORD_TYPE:
        return self._coord

    @property
    def class_id(self) -> int:
        return self._class_id

    def __eq__(self, other):
        return self is other

    def __hash__(self):
        return id(self)


EXAMPLES_BY_CLASS = Tuple[List[ScatterDataPoint], ...]


def sample_data(
    data: EXAMPLES_BY_CLASS,
    initial_zoom_level: float,
    max_zoom_level: float,
    point_radius: float
) -> Tuple[Tuple[float, EXAMPLES_BY_CLASS], ...]:
    """An implementation of Algorithm 1 from paper

    Returns the examples for every zoom level separated by class
    """
    # Make something sample stuff. Equivalent to P in the paper
    data_sampler = ScatterDatasetSampler(data)
    # zoom_level is equivalent to ϕ in the paper.
    zoom_level = initial_zoom_level
    num_classes = len(data)
    out_data = []
    added_points_dist_tracker = DistQueriablePointTracker(num_classes)
    kde = PointsKDE(data)
    while not data_sampler.is_empty() and zoom_level < max_zoom_level:
        # Find w based off equation 2
        w = point_radius / zoom_level * kde.mean_density
        # Store the examples at the current zoom level. Same format seperated by class
        this_zoom_data = tuple([] for _ in data)
        # Store the examples which don't pass so can repopulate at next zoom level.
        #   This is equivalent to P'' in the paper's pseudocode.
        failed_examples = []
        while not data_sampler.is_empty():
            # Select a trial sample from the most unfilled data class
            point = data_sampler.sample_least_filled()
            # Because the distances are
            acceptable_dists = get_acceptable_dists(point, kde, w)
            pass_conflict = conflict_check(point, acceptable_dists, added_points_dist_tracker)
            if pass_conflict:
                this_zoom_data[point.class_id].append(point)
                added_points_dist_tracker.add_point(point)
            else:
                failed_examples.append(point)
        out_data.append((zoom_level, this_zoom_data))
        # 16: Push P''' back to P
        data_sampler.repopulate(failed_examples)
        # 18: ϕ = 2ϕ
        zoom_level *= 2
    return tuple(out_data)


class ScatterDatasetSampler:
    """A store for the scatter points which supports efficient random
    sampling of the 'least filled' point."""
    def __init__(
        self,
        data: EXAMPLES_BY_CLASS
    ):
        self._data = data
        self._shuffle_all_points()
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

    def sample_least_filled(self) -> ScatterDataPoint:
        """Samples a point from the least filled class. Note this removes
        the datapoint from the sampler"""
        least_filled_ind = self.get_least_filled_class_ind()
        least_filled_points = self._data[least_filled_ind]
        # Because we shuffle up front this will be a random point
        sampled_point = least_filled_points.pop()
        assert sampled_point.class_id == least_filled_ind
        return sampled_point

    def num_points(self):
        return sum(len(points) for points in self._data)

    def is_empty(self):
        return self.num_points() == 0

    def repopulate(self, new_points: List[ScatterDataPoint]):
        for new_point in new_points:
            self._data[new_point.class_id].append(new_point)
        self._shuffle_all_points()

    def _shuffle_all_points(self):
        for points in self._data:
            random.shuffle(points)


class DistQueriablePointTracker:
    def __init__(self, num_classes: int, num_dims: float = 2):
        self.num_dims = num_dims
        self.data = [
            DynamicArray((None, num_dims), capacity=1000)
            for _ in range(num_classes)
        ]

    @property
    def num_classes(self):
        return len(self.data)

    def add_point(self, data_point: ScatterDataPoint):
        assert len(data_point.coord) == self.num_dims
        self.data[data_point.class_id].append(np.array(data_point.coord))

    def has_point_in_ball(
        self,
        class_id: int,
        center: Tuple[float, ...],
        radius: float
    ) -> bool:
        points = self.data[class_id]
        if len(points) == 0:
            return False
        dists = np.sum((points - np.array(center))**2, axis=1)
        in_thresh = dists <= radius**2
        return np.any(in_thresh)


def convert_points_to_np(points: List[ScatterDataPoint]) -> np.ndarray:
    return np.array([list(p.coord) for p in points])


class PointsKDE:
    def __init__(self, points_by_class: EXAMPLES_BY_CLASS):
        self._precomp_kdes: Dict[ScatterDataPoint, float] = {}
        self._kde_kernels = []
        self._num_classes = len(points_by_class)
        self._num_points_by_class = []
        all_desnities = []
        for class_id, points in enumerate(points_by_class):
            parray = convert_points_to_np(points)  # (point, coord_dim)
            kernel = stats.gaussian_kde(parray.T, bw_method='silverman')
            self._kde_kernels.append(kernel)
            self._num_points_by_class.append(len(points))
            all_desnities.extend([self.density_at(class_id, point.coord) for point in points])
        self._mean_density = float(np.mean(all_desnities))

    @property
    def num_classes(self):
        return self._num_classes

    @property
    def mean_density(self) -> float:
        """Equivalent to f-bar in paper for equation 2"""
        return self._mean_density

    def density_at(self, class_ind: int, coord: COORD_TYPE) -> float:
        # TODO (DNGros): In section 3.1 they say they do not normalize
        #   by N. So I think we have to multiply by N. However, not
        #   actually 100% sure that scipy is normalizing or not. We might
        #   need to manually calculate it in order to make sure doing it right
        N = self._num_points_by_class[class_ind]
        parray = np.array([list(coord)]).T  # Needs to be (dim, point_num)
        pdf = self._kde_kernels[class_ind].evaluate(np.array(parray))
        assert len(pdf) == 1
        pdf = pdf[0]
        return pdf * N


def get_acceptable_dists(
    data_point: ScatterDataPoint,
    kde: PointsKDE,
    w
) -> Tuple[float, ...]:
    return tuple(
        w / kde.density_at(class_id, data_point.coord)
        for class_id in range(kde.num_classes)
    )


def conflict_check(
    point: ScatterDataPoint,
    acceptable_dists: Tuple[float, ...],
    dist_index: DistQueriablePointTracker
) -> bool:
    """Returns true if passes distance check for every class"""
    assert len(acceptable_dists) == dist_index.num_classes
    return all(
        not dist_index.has_point_in_ball(class_id, point.coord, acceptable_dist)
        for class_id, acceptable_dist in enumerate(acceptable_dists)
    )


