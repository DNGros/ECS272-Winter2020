import random
from src.dataproc import *


def test_scatter_sample():
    num_trials = 10
    for i in range(num_trials):
        sampler = ScatterDatasetSampler(
            data=(
                [1, 2, 3],
                [4],
                [5, 6],
            )
        )
        class_id, p = sampler.sample_least_filled()
        sampled_ids = set([class_id])
        class_id, p = sampler.sample_least_filled()
        assert class_id not in sampled_ids
        class_id, p = sampler.sample_least_filled()
        assert class_id not in sampled_ids
        assert sampler.num_points() == (6 - 3)
        assert sampler.get_least_filled_class_ind() == 0
