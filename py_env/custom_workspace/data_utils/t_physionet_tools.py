import z_Physionet as physio
import os


def get_filenames(
    classes: list[physio.Labels] = None,
    imagined=True,
    physical=False,
    subjects: list[int] = None,
) -> list[tuple[str, int, int]]:
    """
    Returns the required filenames of the given fetch
    """

    def get_runs() -> list[int]:
        """
        Returns which runs must be considered based on imagined, physical, and classes
        """
        assert imagined or physical
        involved_classes = []

        if physio.Labels.BASELINE_EYES_OPENED in classes:
            involved_classes.append(1)
        if physio.Labels.BASELINE_EYES_CLOSED in classes:
            involved_classes.append(2)

        if physio.Labels.RIGHT_FIST in classes or physio.Labels.LEFT_FIST in classes:
            if imagined:
                involved_classes.append(4)
                involved_classes.append(8)
                involved_classes.append(12)
            if physical:
                involved_classes.append(3)
                involved_classes.append(7)
                involved_classes.append(11)

        if physio.Labels.BOTH_FISTS in classes or physio.Labels.BOTH_FEETS in classes:
            if imagined:
                involved_classes.append(6)
                involved_classes.append(10)
                involved_classes.append(14)
            if physical:
                involved_classes.append(5)
                involved_classes.append(9)
                involved_classes.append(13)

        return involved_classes

    def get_subjectfolder(subject) -> str:
        """
        Returns the binary of a subject
        """
        assert subject > 0 and subject < 110
        subject = int(subject)
        if subject < 10:
            subjectfolder = "S00" + str(subject)
        elif subject >= 10 and subject < 100:
            subjectfolder = "S0" + str(subject)
        else:
            subjectfolder = "S" + str(subject)
        return subjectfolder

    def get_edf_filename(subjectfolder: str, run: int):
        """
        Returns the filename of the edf file corresponding to a run and subject-folder
        """
        if run < 10:
            run_number = "0" + str(run)
        else:
            run_number = str(run)
        return subjectfolder + "R" + run_number + ".edf"

    filenames = []
    for subject in subjects:
        subjectfolder = get_subjectfolder(subject)
        cur_folder = os.path.join(physio.PHYSIONET_LOC, subjectfolder)
        runs = get_runs()
        for run in runs:
            filename = get_edf_filename(subjectfolder, run)
            final_folder = os.path.join(cur_folder, filename)
            filenames.append((final_folder, run, subject))
    return filenames
