
module.exports = Object.freeze({
    EVENT_FANMANAGER_LIST_UPDATE: "fanlistupdate",
    EVENT_FANHW_STATE_UPDATE: "fanhwstateupdate",
    EVENT_FANHW_CONFIG_UPDATE: "fanhwconfigupdate",
    EVENT_FANHW_DATA_UPDATE: "fanhwdataupdate",
    EVENT_FANHW_VERSION_UPDATE: "fanhwversionupdate",
    EVENT_FANHW_UI_CONFIG_OPEN_UPDATE: "fanconfigreset",


    MODEL_V1: "1", //original pic
    MODEL_V2: "2", //second pic 6psu 2 tach
    MODEL_V3: "3", //stm ether
    MODEL_V1a: "1a", //second original pic with no op

    ERROR_VOLTAGE: (1 << 0),
    ERROR_FAN: (1 << 1),
    ERROR_TEMP: (1 << 2),
    ERROR_SOUND: (1 << 3) ,

    GPIO_PSU_48_1: (1 << 0),
    GPIO_PSU_DC_1: (1 << 1),
    GPIO_PSU_AC_1: (1 << 2),
    GPIO_PSU_48_2: (1 << 3) ,
    GPIO_PSU_DC_2: (1 << 4),
    GPIO_PSU_AC_2: (1 << 5)
});