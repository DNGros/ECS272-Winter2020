import random
import math
import math
from typing import Tuple, List, Dict, Union
import numpy as np
from scipy import stats

from visualization.src.thirdparty.dynamic_array import DynamicArray

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

    def __str__(self):
        return f"point(cls={self.class_id}, {self.coord}))"

    def __repr__(self):
        return str(self)

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
    num_points = sum(len(cl_points) for cl_points in data)
    while not data_sampler.is_empty() and zoom_level <= max_zoom_level:
        # Find w based off equation 2
        # NOTE: This isn't the exact same as the equation. Using that equation
        # seems to agressive with removing points in the sparser regions.
        # Instead we are going to
        w = (point_radius / zoom_level) * kde.mean_density / math.sqrt(num_points)
        print("w", w)
        print("kde.mean_density", kde.mean_density)
        # Store the examples at the current zoom level. Same format seperated by class
        #   This is like P' in the paper.
        this_zoom_data = tuple([] for _ in data)
        # Store the examples which don't pass so can repopulate at next zoom level.
        #   This is equivalent to P'' in the paper's pseudocode.
        failed_examples = []
        while not data_sampler.is_empty():
            # Select a trial sample from the most unfilled data class
            point = data_sampler.sample_least_filled()
            # Because the distances are
            acceptable_dists = get_closest_acceptable_dist(point, kde, w, point_radius)
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
        """Get fill rate as defined by in section 2.1 in [41]"""
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
    """Allows one to keep track of a set of points by class and query if
    there are any points within a certain radius of a point"""
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


class PointsKDE:
    """Used to calculate f-hat_i(x)"""
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
            this_class_densities = [
                self.density_at(class_id, point.coord) for point in points
            ]
            #print("Class", class_id, "densities", this_class_densities)
            print("Bandwidth", self._kde_kernels[class_id].factor)
            all_desnities.extend(this_class_densities)
        self._mean_density = float(np.mean(all_desnities))

    @property
    def num_classes(self):
        return self._num_classes

    @property
    def mean_density(self) -> float:
        """Equivalent to f-bar in paper for equation 2"""
        return self._mean_density

    def density_at(self, class_ind: int, coord: COORD_TYPE) -> float:
        """Equivalent to calling f-hat_i(x) where i = class_ind and x = coord"""
        N = self._num_points_by_class[class_ind]
        parray = np.array([list(coord)]).T  # Needs to be (dim, point_num) but we only have 1 point
        pdf = self._kde_kernels[class_ind].evaluate(np.array(parray))
        assert len(pdf) == 1
        pdf = pdf[0]
        return pdf * N


def get_closest_acceptable_dist(
    data_point: ScatterDataPoint,
    kde: PointsKDE,
    w: float,
    point_radius: float,
    sample_space_dimens = 2
) -> Tuple[float, ...]:
    """
    This takes the place of BuildRMatrix.

    Calculate the data_point.class_id row of the R matrix. We don't care
    about the other rows for the current point we are trying to add.
    """
    # TODO (DNGros): Here the calcualation of the off diagonals may not be exactly
    #   right. Essentially what we are doing is taking the average of the diagnal
    #   kde and off-diagnal one. In [41] they vaguely seem to suggest this.
    diag_kde = kde.density_at(data_point.class_id, data_point.coord)
    acceptable_dists = tuple(
        # Diag value
        w / diag_kde
        if class_id == data_point.class_id else
        # Non-diag value
        w / ((kde.density_at(class_id, data_point.coord) + diag_kde) / 2)
        for class_id in range(kde.num_classes)
    )
    # Put a hard limit on how close can overlap. The actual paper does not do
    # this, but it seems to be in the spirit of the actual goal.
    acceptable_dists = tuple(max(dist, point_radius*0.7) for dist in acceptable_dists)
    return acceptable_dists


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


def convert_examples_by_class_to_np(data: EXAMPLES_BY_CLASS):
    examples = []
    class_ids = []
    for class_id, points in enumerate(data):
        for point in points:
            examples.append(list(point.coord))
            class_ids.append(class_id)
    return np.array(examples), np.array(class_ids)


def convert_np_to_points(
        points: np.ndarray,  # (n_points, dim)
        class_ids: np.ndarray  # (n_points)
) -> EXAMPLES_BY_CLASS:
    class_id_set = set(class_ids)
    # The incoming class ids might be nonsequential or even strings.
    # Internally keep track of sequential ids
    class_id_set_to_seq_id = {
        i: class_id
        for i, class_id in enumerate(sorted(class_id_set))
    }
    data = []
    for class_id in class_id_set_to_seq_id.values():
        is_in_class = class_ids == class_id_set_to_seq_id[class_id]
        class_points = points[is_in_class]
        class_data = []
        for point in class_points:
            class_data.append(ScatterDataPoint(class_id, tuple(point)))
        data.append(class_data)
    return tuple(data)


def convert_points_to_np(points: List[ScatterDataPoint]) -> np.ndarray:
    return np.array([list(p.coord) for p in points])


class ColorManager():
    """
    Generate optimized colors for each class for best distinguishability
    """
    def __init__(self, points: EXAMPLES_BY_CLASS):
        self.n_sample = 100j
        self.points = points
        self.kde = PointsKDE(points)
        self.colors = []

        thres = 10
        for _ in range(10):
            self.generate_colors()
            # TODO (Jiayu): This is wrong, distance between any two colors should
            # be less than the threshold. The threshold is arbitrarily set for now.
            # Need tests to set a better value
            if self.K_cost(self.colors) > thres:
                break
            else:
                self.colors = []
        assert self.colors

    
    def K_cost(
        self,
        colors: Tuple[Tuple[float, float, float], ...],
        points = self.points
    ) -> float:
        """Equation 3 in the paper
        only handles 2D coords"""
        n_class = len(points)
        kde = PointsKDE(points)
        points = convert_points_to_np(points)
        max_x = points[:, 0].max()
        min_x = points[:, 0].min()
        max_y = points[:, 1].max()
        min_y = points[:, 1].min()
        samples = np.mgrid[min_x:max_x:self.n_sample, min_y:max_y:self.n_sample].T
        E = 0
        for _ in samples:
            local = 0
            for sample in _:
                for i in range(n_class):
                    for j in range(i+1, n_class):
                        local += self._alpha(sample, i, j) * self.color_dist(self.colors[i], self.colors[j])
                E += self._beta(sample) * local
        return E


    def _alpha(self, sample: List[int, int], i: int, j: int) -> float:
        """Calculate alpha in region, equation 4"""
        return math.e ** (-abs(self.kde.density_at(i, sample), self.kde.density_at(j, sample)))


    def _beta(self, sample: List[int, int]) -> float:
        """Calculate beta in region, equation 4"""
        return sum([self.kde.density_at(i, sample) for i in range(len(self.points))])


    def generate_colors(self):
        """Generate colors for each class in CIELAB color space that can result in 
        minimum K_cost"""
        # TODO (Jiayu): Still need to find a way to generate colors that are
        # quite distinct from each other, and can yield minimum K_cost
        pass


    def color_dist(
        self,
        color1: Tuple[float, float, float],
        color2: Tuple[float, float, float]
    ) -> float:
        """Calculate the euclidean distance between colors"""
        x1, y1, z1 = color1
        x2, y2, z2 = color2
        return math.sqrt((x1-x2) ** 2 + (y1-y2) ** 2 + (z1-z2) ** 2)

