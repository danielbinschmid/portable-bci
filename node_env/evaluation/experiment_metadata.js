// EEGNet-HDC experiments
import CNNHDC_withinsession from "./experiments/cnn_hdc/e_cnnhdcImmediateUse";
import CNNHDC_crossSessionAll from "./experiments/cnn_hdc/e_cnnhdcRef";
import CNNHDC_crossSessionPartial from "./experiments/cnn_hdc/e_cnnhdcPartialCrossSession";

// Dimension ranking optimization (DRO) experiments
import DRO from "./experiments/dro/e_dro_crossSubject"
import DRO_RiemannTransfer from "./experiments/dro/e_dro_plusRiemann"
import DRO_Partial from "./experiments/dro/e_dro_plusRiemann_partialTraining"
import DRO_debug from "./experiments/dro/e_dro"

// Experiments with Hersche encoding
import Hersche_crossSession from "./experiments/hersche/e_hdcHersche"
import Hersche_crossSessionPartial from "./experiments/hersche/e_hdcHerschePartialCrossSession"
import Hersche_museMI from "./experiments/hersche/e_hdcMuseMI";
import Hersche_crossSubject from "./experiments/hersche/e_onlineCrossSubjectAdaptionNaiveHersche"
import Hersche_withinSessionOnline from "./experiments/hersche/e_thermometerCrossSessionOnline";

// experiments with Riemann-CiM encoding
import RiemannCiM_fhrrPartial from "./experiments/riemann_cim/e_hdcFHrrPartialTraining"
import RiemannCiM_hrrCrossSessionFull from "./experiments/riemann_cim/e_hdcRiemannCiM"
import RiemannCiM_hrrPartial from "./experiments/riemann_cim/e_onlineCrossSessionAdaption"
import RiemannCiM_hrrCrossSubject from "./experiments/riemann_cim/e_subjectIndependent"

// Riemannian mean
import RiemannMean_runtime from "./experiments/riemann_mean/e_meanMetricRuntimes"
import RiemannMean_withinSession from "./experiments/riemann_mean/e_meanMetrics3FoldCross"
import RiemannMean_noTransfer from "./experiments/riemann_mean/e_noTransfer"
import RiemannMean_offlineTransfer from "./experiments/riemann_mean/e_transferBaseline"



export const experiments = [
    {
        name: "EEGNet-HDC",
        folder_name: "cnn_hdc/",
        experiments: [
            {
                name: "Within-session evaluation",
                method: CNNHDC_withinsession
            },
            {
                name: "Cross-session evaluation with full training set",
                method: CNNHDC_crossSessionAll
            },
            {
                name: "Cross-session evaluation with partial training sets",
                method: CNNHDC_crossSessionPartial
            }
        ]
    },
    {
        name: "Dimension Ranking Optimization",
        folder_name: "dro/",
        experiments: [
            {
                name: "Cross-subject",
                method: DRO
            },
            {
                name: "With Riemannian transfer, cross-subject",
                method: DRO_RiemannTransfer
            },
            {
                name: "Partial training sets",
                method: DRO_Partial
            },
            {
                name: "Verify dimension ranking",
                method: DRO_debug
            }
        ]
    },
    {
        name: "Riemann embeddings by Hersche et al",
        folder_name: "hersche/",
        experiments: [
            {
                name: "Cross-session, full training sets",
                method: Hersche_crossSession
            },
            {
                name: "Cross-session, partial training sets",
                method: Hersche_crossSessionPartial
            },
            {
                name: "Reduced Muse MI dataset",
                method: Hersche_museMI
            },
            {
                name: "Cross-subject",
                method: Hersche_crossSubject
            },
            {
                name: "Within-session online",
                method: Hersche_withinSessionOnline
            }
        ]
    },
    {
        name: "Riemann CiM embeddings",
        folder_name: "riemann_cim/",
        experiments: [
            {
                name: "fHRR, cross-session with partial training sets",
                method: RiemannCiM_fhrrPartial
            },
            {
                name: "HRR, cross-session with full training set",
                method: RiemannCiM_hrrCrossSessionFull
            },
            {
                name: "HRR, cross-session with partial training sets",
                method: RiemannCiM_hrrPartial
            },
            {
                name: "HRR, cross-subject",
                method: RiemannCiM_hrrCrossSubject
            }
        ]
    },
    {
        name: "Riemannian mean metrics benchmarks",
        folder_name: "riemann_mean/",
        experiments: [
            {
                name: "Runtimes",
                method: RiemannMean_runtime
            },
            {
                name: "Within-session",
                method: RiemannMean_withinSession
            },
            {
                name: "Without Riemann mean transfer baseline",
                method: RiemannMean_noTransfer
            },
            {
                name: "Offline tranfer",
                method: RiemannMean_offlineTransfer
            }
        ]
    }
]