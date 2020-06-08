class Schools:
    """
    Supported Schools Enum
    """
    BRANSON = 'branson'
    MA = 'ma'

    @staticmethod
    def is_valid(school):
        """
        Check whether a school is or is not valid
        :param school: school to check
        :return: boolean indicating validity
        """
        return school in [
            Schools.BRANSON, Schools.MA
        ]

