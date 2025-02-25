// 获取当前年份
    const currentYear = new Date().getFullYear();
    const defaultYear = 2024;

    // 动态生成版权年份
    const copyrightYearElement = document.getElementById("copyrightYear");
    if (currentYear === defaultYear) {
        copyrightYearElement.textContent = "秦先生个人版权所有 " + `© ${defaultYear} `;
    } else {
        copyrightYearElement.textContent = "秦先生个人版权所有 " + `© ${defaultYear}-${currentYear} `;
    }

    // 获取模态元素
    // 第一个模态元素 start
    const modal = document.getElementById("generateModal");
    const btn = document.getElementById("generateMessageBtn");
    // 按钮点击时，显示弹窗
    btn.onclick = function () {
        modal.style.display = "block";
        // 计算发报时间
        const now = new Date();
        const transmitTime = now.getFullYear().toString().slice(2) +
            ("00" + (now.getMonth() + 1)).slice(-2) +
            ("00" + now.getDate()).slice(-2) +
            ("00" + now.getHours()).slice(-2) +
            ("00" + now.getMinutes()).slice(-2) +
            ("00" + now.getSeconds()).slice(-2);
        // 填充输入框
        document.getElementById("transmitTime").value = transmitTime;
        // 计算流水号
        const serialNumber = ("0000" + (Math.floor(Math.random() * 65535) + 1).toString(16)).slice(-4);
        // 填充输入框
        document.getElementById("serialNumber").value = serialNumber;
        // 计算观测时间
        const observationTime = "F0F0" + transmitTime.substring(0, 10);
        // 填充输入框
        document.getElementById("observationTime").value = observationTime;
    }
    const span = document.getElementById("closeModal");
    // 点击关闭按钮时关闭第一个模态弹窗
    span.onclick = function () {
        modal.style.display = "none";
        resultDiv.style.display = "none";  // 关闭弹窗时清空报文结果
    }
    // 生成报文按钮
    const generateReportBtn = document.getElementById("generateReportBtn");
    // 生成报文按钮->点击事件
    generateReportBtn.onclick = function () {
        // 获取报头
        const frameStartCharacter = document.getElementById("frameStartCharacter").value;
        // 获取中心地址
        const centerAddr = document.getElementById("centerAddr").value;
        // 获取遥测站地址
        const telemetryStationAddr = document.getElementById("telemetryStationAddr").value;
        // 获取密码
        const pwd = document.getElementById("pwd").value;
        // 获取功能码
        const functionCode = document.getElementById("functionCode").value;
        // 获取报文起始符
        const msgStart = document.getElementById("msgStart").value;
        // 获取流水号
        const serialNumber = document.getElementById("serialNumber").value;
        // 获取发报时间
        const transmitTime = document.getElementById("transmitTime").value;
        // 获取正文遥测站地址
        const telemetryStationAddrTwo = document.getElementById("telemetryStationAddrTwo").value;
        // 获取遥测站分类码
        const telemetryStationCode = document.getElementById("telemetryStationCode").value;
        // 获取观测时间
        const observationTime = document.getElementById("observationTime").value;
        // 获取报文结束符
        const msgEnd = document.getElementById("msgEnd").value;
        // 获取新增输入框的值
        // 获取所有动态生成的输入框
        let additionalValues = {};
        if (counter !== 0) {
            const additionalFields = document.querySelectorAll("input[data-dynamic='true']");
            additionalFields.forEach((input, index) => {
                additionalValues[`input_${index}`] = input.value;  // 使用唯一标识符存储
            });
        }
        // 检查必填字段是否为空
        if (!telemetryStationAddr || !pwd || !serialNumber || !transmitTime || !telemetryStationAddrTwo || !telemetryStationCode || !observationTime) {
            alert("请填写所有必填项！");
            return; // 退出函数
        }
        // 校验可输入字段的合法性
        const isValidHex = (str) => /^[0-9a-fA-F]+$/.test(str); // 仅允许 0-9 和 a-f
        // 检查每个输入框是否有值
        for (const key in additionalValues) {
            if (!additionalValues[key]) {
                alert("请填写所有必填项！");
                return; // 退出函数
            }
            if (!isValidHex(additionalValues[key])) {
                alert("请确保标识要素、数据定义、参数值仅包含数字和字母 a-f！");
                return; // 退出函数
            }
        }
        if (!isValidHex(telemetryStationAddr) || !isValidHex(pwd)) {
            alert("请确保遥测站地址、密码仅包含数字和字母 a-f！");
            return; // 退出函数
        }
        // 合并正文内容计算正文标识符及长度
        const identifier = (serialNumber + transmitTime + telemetryStationAddrTwo + telemetryStationCode + observationTime + Object.values(additionalValues).join('')).toLowerCase();
        const msgBodyLength = Math.ceil(identifier.length / 2);
        const identifierLength = "0" + msgBodyLength.toString(16).padStart(3, "0");
        // 填充输入框
        document.getElementById("identifierLength").value = identifierLength;
        // 合并报文计算CRC校验码
        const message = (frameStartCharacter + centerAddr + telemetryStationAddr + pwd + functionCode + identifierLength + msgStart + identifier + msgEnd).toLowerCase();
        const CRCCheckCode = computeCRCCode(message);
        // 填充输入框
        document.getElementById("CRCCheckCode").value = CRCCheckCode;
        // 将报文内容填充到弹窗中
        generatedMessage.textContent = message + CRCCheckCode;
        // 显示报文结果
        resultDiv.style.display = "block";
    }
    const generatedMessage = document.getElementById("generatedMessage");
    const resultDiv = document.getElementById("result");
    const addInputFieldBtn = document.getElementById("addInputFieldBtn");
    const removeInputFieldBtn = document.getElementById("removeInputFieldBtn");
    const messageForm = document.getElementById("messageForm");
    // 创建一个Map，存储字段的标识和描述
    const fieldMap = new Map([
        ['identifyingElement', '标识要素'],
        ['dataDefinition', '数据定义'],
        ['paramVal', '参数值']
    ]);
    // 计数器，确保每组输入框的id唯一
    let counter = 0;
    // 新增输入框功能
    addInputFieldBtn.onclick = function () {
        // 创建一个新的输入框组
        const newInputDivGroup = document.createElement('div');
        newInputDivGroup.setAttribute('id', `inputGroup_${counter}`);  // 使用计数器确保输入框组唯一
        // 遍历Map，动态创建标签和输入框
        fieldMap.forEach((labelText, fieldName) => {
            const newInputDiv = document.createElement('div');
            newInputDiv.classList.add('form-group');
            // 创建标签
            const newLabel = document.createElement('label');
            newLabel.setAttribute('for', `input_${counter}_${fieldName}`);  // 使用计数器确保id唯一
            newLabel.textContent = labelText;  // 显示Map中的描述
            // 创建输入框
            const newInput = document.createElement('input');
            newInput.type = 'text';  // 默认类型为文本框
            newInput.id = `input_${counter}_${fieldName}`;  // 使用计数器确保id唯一
            newInput.name = fieldName;  // 设置name，方便提交时获取
            newInput.setAttribute('data-dynamic', 'true'); // 添加自定义的data属性来标识动态输入框
            newInput.required = true;  // 强制要求用户填写此字段
            newInput.placeholder = `请输入${labelText}`;  // 动态设置placeholder
            // 将标签和输入框添加到新的<div>中
            newInputDiv.appendChild(newLabel);
            newInputDiv.appendChild(newInput);
            // 将新的<div>添加到该组中
            newInputDivGroup.appendChild(newInputDiv);
        });
        // 将新的输入框组添加到表单中
        messageForm.appendChild(newInputDivGroup);
        // 增加计数器，以确保每次生成的输入框组唯一
        counter++;
    };
    // 删除最后一组输入框
    removeInputFieldBtn.onclick = function () {
        if (counter > 0) {
            counter--;  // 减少计数器
            const lastInputGroup = document.getElementById(`inputGroup_${counter}`);
            if (lastInputGroup) {
                messageForm.removeChild(lastInputGroup);  // 删除最后一组输入框
            }
        } else {
            alert('没有更多的输入框可以删除!');
        }
    };
    // 流水号重新生成按钮
    const serialNumberBtn = document.getElementById("serialNumberBtn");
    // 流水号重新生成按钮->点击事件
    serialNumberBtn.onclick = function () {
        // 计算流水号填充输入框
        document.getElementById("serialNumber").value = ("0000" + (Math.floor(Math.random() * 65535) + 1).toString(16)).slice(-4);
    }
    // 发报时间重新生成按钮
    const transmitTimeBtn = document.getElementById("transmitTimeBtn");
    // 发报时间重新生成按钮->点击事件
    transmitTimeBtn.onclick = function () {
        // 计算发报时间
        const now = new Date();
        const transmitTime = now.getFullYear().toString().slice(2) +
            ("00" + (now.getMonth() + 1)).slice(-2) +
            ("00" + now.getDate()).slice(-2) +
            ("00" + now.getHours()).slice(-2) +
            ("00" + now.getMinutes()).slice(-2) +
            ("00" + now.getSeconds()).slice(-2);
        // 填充输入框
        document.getElementById("transmitTime").value = transmitTime;

        // 计算观测时间填充输入框
        document.getElementById("observationTime").value = "F0F0" + transmitTime.substring(0, 10);
    }
    // 遥测站地址Input事件
    telemetryStationAddrIpu = function () {
        // 填充输入框
        document.getElementById("telemetryStationAddrTwo").value = "F1F1" + document.getElementById("telemetryStationAddr").value;
    }
    // 第一个模态元素 end

    // 第二个模态元素 start
    const modalTwo = document.getElementById("analyzeModal");
    const btnTwo = document.getElementById("analyzeMessageBtn");
    // 按钮点击时，显示弹窗
    btnTwo.onclick = function () {
        modalTwo.style.display = "block";
    }
    const spanTwo = document.getElementById("closeModalTwo");
    // 点击关闭按钮时关闭第二个模态弹窗
    spanTwo.onclick = function () {
        modalTwo.style.display = "none";
    }
    // 解析报文按钮
    const analyzeReportBtn = document.getElementById("analyzeReportBtn");
    // 解析输入的报文按钮
    analyzeReportBtn.onclick = function () {
        // 获取报文
        const message = document.getElementById("messageTextarea").value;
        // 检查必填字段是否为空
        if (!message) {
            alert("请填写待解析的报文！");
            return; // 退出函数
        }
        if (message.substring(0, 4).toLowerCase() !== "7e7e") {
            alert("待解析的报文错误！");
            return; // 退出函数
        }
        let contentStart = message.substring(26, 28);
        let content = message.substring(28, message.toString().length - 6);
        let analyzeMsgList = [];
        if ("02" === contentStart) {
            let msgTime = content.substring(4, 16);
            analyzeMsgList.push("发报时间:" + formatDate(msgTime));
            let measuringStation = content.substring(20, 30);
            analyzeMsgList.push("遥测站站号:" + measuringStation);
            let observedTime = content.substring(36, 46);
            analyzeMsgList.push("观测时间:" + formatDate(observedTime) + "00");
            let length = content.length;
            let currentIndex = 46;
            const ZT45HEnumData = [
                {
                    "code": "BIT0",
                    "name": "交流电充电状态",
                    "descMap": {
                        "0": "正常",
                        "1": "停电",
                    }
                },
                {
                    "code": "BIT1",
                    "name": "蓄电池电压状态",
                    "descMap": {
                        "0": "正常",
                        "1": "电压低",
                    }
                },
                {
                    "code": "BIT2",
                    "name": "水位超限报警状态",
                    "descMap": {
                        "0": "正常",
                        "1": "报警",
                    }
                },
                {
                    "code": "BIT3",
                    "name": "流量超限报警状态",
                    "descMap": {
                        "0": "正常",
                        "1": "报警",
                    }
                },
                {
                    "code": "BIT4",
                    "name": "水质超限报警状态",
                    "descMap": {
                        "0": "正常",
                        "1": "报警",
                    }
                },
                {
                    "code": "BIT5",
                    "name": "流量仪表状态",
                    "descMap": {
                        "0": "正常",
                        "1": "故障",
                    }
                },
                {
                    "code": "BIT6",
                    "name": "水位仪表状态",
                    "descMap": {
                        "0": "正常",
                        "1": "故障",
                    }
                },
                {
                    "code": "BIT7",
                    "name": "终端箱门状态",
                    "descMap": {
                        "0": "开启",
                        "1": "关闭",
                    }
                },
                {
                    "code": "BIT8",
                    "name": "存储器状态",
                    "descMap": {
                        "0": "正常",
                        "1": "异常",
                    }
                },
                {
                    "code": "BIT9",
                    "name": "IC卡功能有效",
                    "descMap": {
                        "0": "关闭",
                        "1": "IC卡有效",
                    }
                },
                {
                    "code": "BIT10",
                    "name": "水泵工作状态",
                    "descMap": {
                        "0": "水泵工作",
                        "1": "水泵停机",
                    }
                },
                {
                    "code": "BIT11",
                    "name": "剩余水量报警",
                    "descMap": {
                        "0": "未超限",
                        "1": "水量超限",
                    }
                },
                {
                    "code": "NULL",
                    "name": "未定义",
                    "descMap": {}
                }
            ];
            // 转换为 Map，以 code 为 key
            const zt45HEnumMatchCode = new Map(ZT45HEnumData.map(item => [item.code, item]));
            const SL651IdentifierEnumData = [
                {
                    "code": "F0",
                    "accuracy": 0,
                    "description": "观测时间引导符a",
                    "unit": "",
                    "dataType": "String",
                    "encode": "BCD"
                },
                {
                    "code": "F1",
                    "accuracy": 0,
                    "description": "测站编码引导符b",
                    "unit": "",
                    "dataType": "String",
                    "encode": "BCD"
                },
                {
                    "code": "F2",
                    "accuracy": 0,
                    "description": "人工置数c",
                    "unit": "d字节",
                    "dataType": "String",
                    "encode": "HEX"
                },
                {
                    "code": "F3",
                    "accuracy": 0,
                    "description": "图片信息d",
                    "unit": "KB",
                    "dataType": "",
                    "encode": "HEX"
                },
                {
                    "code": "F4",
                    "accuracy": 1,
                    "description": "1小时内每5分钟时段雨量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "HEX"
                },
                {
                    "code": "F5",
                    "accuracy": 2,
                    "description": "1小时内5分钟间隔相对水位1",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "HEX"
                },
                {
                    "code": "F6",
                    "accuracy": 2,
                    "description": "1小时内5分钟间隔相对水位2",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "HEX"
                },
                {
                    "code": "F7",
                    "accuracy": 2,
                    "description": "1小时内5分钟间隔相对水位3",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "HEX"
                },
                {
                    "code": "F8",
                    "accuracy": 2,
                    "description": "1小时内5分钟间隔相对水位4",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "HEX"
                },
                {
                    "code": "F9",
                    "accuracy": 2,
                    "description": "1小时内5分钟间隔相对水位5",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "HEX"
                },
                {
                    "code": "FA",
                    "accuracy": 2,
                    "description": "1小时内5分钟间隔相对水位6",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "HEX"
                },
                {
                    "code": "FB",
                    "accuracy": 2,
                    "description": "1小时内5分钟间隔相对水位7",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "HEX"
                },
                {
                    "code": "FC",
                    "accuracy": 2,
                    "description": "1小时内5分钟间隔相对水位8",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "HEX"
                }, {
                    "code": "01",
                    "accuracy": 2,
                    "description": "断面面积",
                    "unit": "㎡",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "02",
                    "accuracy": 1,
                    "description": "瞬时气温",
                    "unit": "°C",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "03",
                    "accuracy": 1,
                    "description": "瞬时水温",
                    "unit": "°C",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "05",
                    "accuracy": 0,
                    "description": "时段长,降水、引排水、抽水历时",
                    "unit": "小时.分钟",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "06",
                    "accuracy": 1,
                    "description": "日蒸发量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "07",
                    "accuracy": 1,
                    "description": "当前蒸发",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "08",
                    "accuracy": 0,
                    "description": "气压",
                    "unit": "hPa",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "09",
                    "accuracy": 2,
                    "description": "闸坝、水库闸门开启高度",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "0A",
                    "accuracy": 0,
                    "description": "输水设备、闸门(组)编号",
                    "unit": "",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "0B",
                    "accuracy": 0,
                    "description": "输水设备类别",
                    "unit": "",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "0C",
                    "accuracy": 0,
                    "description": "水库、闸坝闸门开启孔数",
                    "unit": "孔",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "0D",
                    "accuracy": 1,
                    "description": "地温",
                    "unit": "°C",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "0E",
                    "accuracy": 2,
                    "description": "地下水瞬时埋深",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "0F",
                    "accuracy": 2,
                    "description": "波浪高度",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                }, {
                    "code": "10",
                    "accuracy": 1,
                    "description": "10厘米处土壤含水量",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "11",
                    "accuracy": 1,
                    "description": "20厘米处土壤含水量",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "12",
                    "accuracy": 1,
                    "description": "30厘米处土壤含水量",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "13",
                    "accuracy": 1,
                    "description": "40厘米处土壤含水量",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "14",
                    "accuracy": 1,
                    "description": "50厘米处土壤含水量",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "15",
                    "accuracy": 1,
                    "description": "60厘米处土壤含水量",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "16",
                    "accuracy": 1,
                    "description": "80厘米处土壤含水量",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "17",
                    "accuracy": 1,
                    "description": "100厘米处土壤含水量",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "18",
                    "accuracy": 1,
                    "description": "湿度",
                    "unit": "%",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "19",
                    "accuracy": 0,
                    "description": "开机台数",
                    "unit": "台",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "1A",
                    "accuracy": 1,
                    "description": "1小时时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "1B",
                    "accuracy": 1,
                    "description": "2小时时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "1C",
                    "accuracy": 1,
                    "description": "3小时时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "1D",
                    "accuracy": 1,
                    "description": "6小时时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "1E",
                    "accuracy": 1,
                    "description": "12小时时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "1F",
                    "accuracy": 1,
                    "description": "日降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                }, {
                    "code": "20",
                    "accuracy": 1,
                    "description": "当前降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "21",
                    "accuracy": 1,
                    "description": "1分钟时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "22",
                    "accuracy": 1,
                    "description": "5分钟时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "23",
                    "accuracy": 1,
                    "description": "10分钟时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "24",
                    "accuracy": 1,
                    "description": "30分钟时段降水量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "25",
                    "accuracy": 1,
                    "description": "暴雨量",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "26",
                    "accuracy": 1,
                    "description": "降水量累计值",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "27",
                    "accuracy": 3,
                    "description": "瞬时流量、抽水流量",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "28",
                    "accuracy": 3,
                    "description": "取(排）水口流量1",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "29",
                    "accuracy": 3,
                    "description": "取(排）水口流量2",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "2A",
                    "accuracy": 3,
                    "description": "取(排）水口流量3",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "2B",
                    "accuracy": 3,
                    "description": "取(排）水口流量4",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "2C",
                    "accuracy": 3,
                    "description": "取(排）水口流量5",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "2D",
                    "accuracy": 3,
                    "description": "取(排）水口流量6",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "2E",
                    "accuracy": 3,
                    "description": "取(排）水口流量7",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "2F",
                    "accuracy": 3,
                    "description": "取(排）水口流量8",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                }, {
                    "code": "30",
                    "accuracy": 3,
                    "description": "总出库流量、过闸总流量",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "31",
                    "accuracy": 3,
                    "description": "输水设备流量、过闸(组)流量",
                    "unit": "m³/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "32",
                    "accuracy": 3,
                    "description": "输沙量",
                    "unit": "万吨",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "33",
                    "accuracy": 2,
                    "description": "风向",
                    "unit": "",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "34",
                    "accuracy": 2,
                    "description": "风力(级)",
                    "unit": "",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "35",
                    "accuracy": 1,
                    "description": "风速",
                    "unit": "m/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "36",
                    "accuracy": 3,
                    "description": "断面平均流速",
                    "unit": "m/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "37",
                    "accuracy": 3,
                    "description": "当前瞬时流速",
                    "unit": "m/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "38",
                    "accuracy": 2,
                    "description": "电源电压",
                    "unit": "V",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "39",
                    "accuracy": 3,
                    "description": "瞬时河道水位、潮位",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "3A",
                    "accuracy": 3,
                    "description": "库(闸、站)下水位",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "3B",
                    "accuracy": 3,
                    "description": "库(闸、站)上水位",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "3C",
                    "accuracy": 3,
                    "description": "取(排）水口水位1",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "3D",
                    "accuracy": 3,
                    "description": "取(排）水口水位2",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "3E",
                    "accuracy": 3,
                    "description": "取(排）水口水位3",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "3F",
                    "accuracy": 3,
                    "description": "取(排）水口水位4",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                }, {
                    "code": "40",
                    "accuracy": 3,
                    "description": "取(排）水口水位5",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "41",
                    "accuracy": 3,
                    "description": "取(排）水口水位6",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "42",
                    "accuracy": 3,
                    "description": "取(排）水口水位7",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "43",
                    "accuracy": 3,
                    "description": "取(排）水口水位8",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "44",
                    "accuracy": 3,
                    "description": "含沙量",
                    "unit": "kg/m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "45",
                    "accuracy": 0,
                    "description": "遥测站状态及报警信息",
                    "unit": "",
                    "dataType": "String",
                    "encode": "HEX"
                },
                {
                    "code": "46",
                    "accuracy": 2,
                    "description": "pH",
                    "unit": "",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "47",
                    "accuracy": 1,
                    "description": "溶解氧",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "48",
                    "accuracy": 0,
                    "description": "电导率",
                    "unit": "uS/cm",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "49",
                    "accuracy": 0,
                    "description": "浊度",
                    "unit": "NTU",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "4A",
                    "accuracy": 1,
                    "description": "高锰酸盐指数",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "4B",
                    "accuracy": 1,
                    "description": "氧化还原电位",
                    "unit": "mV",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "4C",
                    "accuracy": 2,
                    "description": "氨氮",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "4D",
                    "accuracy": 3,
                    "description": "总磷",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "4E",
                    "accuracy": 2,
                    "description": "总氮",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "4F",
                    "accuracy": 2,
                    "description": "总有机碳",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                }, {
                    "code": "50",
                    "accuracy": 4,
                    "description": "铜",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "51",
                    "accuracy": 4,
                    "description": "锌",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "52",
                    "accuracy": 5,
                    "description": "硒",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "53",
                    "accuracy": 5,
                    "description": "砷",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "54",
                    "accuracy": 5,
                    "description": "总汞",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "55",
                    "accuracy": 5,
                    "description": "镉",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "56",
                    "accuracy": 5,
                    "description": "铅",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "57",
                    "accuracy": 2,
                    "description": "叶绿素a",
                    "unit": "mg/L",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "58",
                    "accuracy": 2,
                    "description": "水压1",
                    "unit": "kPa",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "59",
                    "accuracy": 2,
                    "description": "水压2",
                    "unit": "kPa",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "5A",
                    "accuracy": 2,
                    "description": "水压3",
                    "unit": "kPa",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "5B",
                    "accuracy": 2,
                    "description": "水压4",
                    "unit": "kPa",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "5C",
                    "accuracy": 2,
                    "description": "水压5",
                    "unit": "kPa",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "5D",
                    "accuracy": 2,
                    "description": "水压6",
                    "unit": "kPa",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "5E",
                    "accuracy": 2,
                    "description": "水压7",
                    "unit": "kPa",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "5F",
                    "accuracy": 2,
                    "description": "水压8",
                    "unit": "kPa",
                    "dataType": "Double",
                    "encode": "BCD"
                }, {
                    "code": "60",
                    "accuracy": 3,
                    "description": "水表1剩余水量",
                    "unit": "m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "61",
                    "accuracy": 3,
                    "description": "水表2剩余水量",
                    "unit": "m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "62",
                    "accuracy": 3,
                    "description": "水表3剩余水量",
                    "unit": "m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "63",
                    "accuracy": 3,
                    "description": "水表1剩余水量",
                    "unit": "m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "64",
                    "accuracy": 3,
                    "description": "水表5剩余水量",
                    "unit": "m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "65",
                    "accuracy": 3,
                    "description": "水表6剩余水量",
                    "unit": "m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "66",
                    "accuracy": 3,
                    "description": "水表7剩余水量",
                    "unit": "m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "67",
                    "accuracy": 3,
                    "description": "水表8剩余水量",
                    "unit": "m³",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "68",
                    "accuracy": 2,
                    "description": "水表1每小时水量",
                    "unit": "m³/h",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "69",
                    "accuracy": 2,
                    "description": "水表2每小时水量",
                    "unit": "m³/h",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "6A",
                    "accuracy": 2,
                    "description": "水表3每小时水量",
                    "unit": "m³/h",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "6B",
                    "accuracy": 2,
                    "description": "水表4每小时水量",
                    "unit": "m³/h",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "6C",
                    "accuracy": 2,
                    "description": "水表5每小时水量",
                    "unit": "m³/h",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "6D",
                    "accuracy": 2,
                    "description": "水表6每小时水量",
                    "unit": "m³/h",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "6E",
                    "accuracy": 2,
                    "description": "水表7每小时水量",
                    "unit": "m³/h",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "6F",
                    "accuracy": 2,
                    "description": "水表8每小时水量",
                    "unit": "m³/h",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "70",
                    "accuracy": 1,
                    "description": "交流A相电压",
                    "unit": "V",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "71",
                    "accuracy": 1,
                    "description": "交流B相电压",
                    "unit": "V",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "72",
                    "accuracy": 1,
                    "description": "交流C相电压",
                    "unit": "V",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "73",
                    "accuracy": 1,
                    "description": "交流A相电流",
                    "unit": "A",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "74",
                    "accuracy": 1,
                    "description": "交流B相电流",
                    "unit": "A",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "75",
                    "accuracy": 1,
                    "description": "交流C相电流",
                    "unit": "A",
                    "dataType": "Double",
                    "encode": "BCD"
                }, {
                    "code": "FF01",
                    "accuracy": 2,
                    "description": "开度01",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF02",
                    "accuracy": 2,
                    "description": "开度02",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF03",
                    "accuracy": 2,
                    "description": "开度03",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF04",
                    "accuracy": 2,
                    "description": "开度04",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF05",
                    "accuracy": 2,
                    "description": "开度05",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF06",
                    "accuracy": 2,
                    "description": "开度06",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF07",
                    "accuracy": 2,
                    "description": "开度07",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF08",
                    "accuracy": 2,
                    "description": "开度08",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF09",
                    "accuracy": 2,
                    "description": "开度09",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF10",
                    "accuracy": 2,
                    "description": "开度10",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF11",
                    "accuracy": 2,
                    "description": "开度11",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF12",
                    "accuracy": 2,
                    "description": "开度12",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF13",
                    "accuracy": 2,
                    "description": "开度13",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF14",
                    "accuracy": 2,
                    "description": "开度14",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF15",
                    "accuracy": 2,
                    "description": "开度15",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF16",
                    "accuracy": 2,
                    "description": "开度16",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF17",
                    "accuracy": 2,
                    "description": "开度17",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF18",
                    "accuracy": 0,
                    "description": "信号质量",
                    "unit": "",
                    "dataType": "Integer",
                    "encode": "BCD"
                },
                {
                    "code": "FF19",
                    "accuracy": 2,
                    "description": "荷重01",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                }, {
                    "code": "FF20",
                    "accuracy": 2,
                    "description": "荷重02",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF21",
                    "accuracy": 2,
                    "description": "荷重03",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF22",
                    "accuracy": 2,
                    "description": "荷重04",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF23",
                    "accuracy": 2,
                    "description": "荷重05",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF24",
                    "accuracy": 2,
                    "description": "荷重06",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF25",
                    "accuracy": 2,
                    "description": "荷重07",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF26",
                    "accuracy": 2,
                    "description": "荷重08",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF27",
                    "accuracy": 2,
                    "description": "荷重09",
                    "unit": "t",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF28",
                    "accuracy": 3,
                    "description": "量水堰1",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF29",
                    "accuracy": 3,
                    "description": "量水堰2",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF2B",
                    "accuracy": 0,
                    "description": "累计流量",
                    "unit": "m³",
                    "dataType": "Integer",
                    "encode": "BCD"
                }, {
                    "code": "FF30",
                    "accuracy": 3,
                    "description": "量水堰3",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF38",
                    "accuracy": 3,
                    "description": "垂线1流速",
                    "unit": "m/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF39",
                    "accuracy": 3,
                    "description": "垂线2流速",
                    "unit": "m/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF3A",
                    "accuracy": 3,
                    "description": "垂线3流速",
                    "unit": "m/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF3B",
                    "accuracy": 3,
                    "description": "垂线4流速",
                    "unit": "m/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF3C",
                    "accuracy": 3,
                    "description": "垂线5流速",
                    "unit": "m/s",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF97",
                    "accuracy": 2,
                    "description": "X位移",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF98",
                    "accuracy": 2,
                    "description": "Y位移",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FF99",
                    "accuracy": 2,
                    "description": "Z位移",
                    "unit": "mm",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FFB6",
                    "accuracy": 3,
                    "description": "大坝渗流点1水位",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FFB7",
                    "accuracy": 3,
                    "description": "大坝渗流点2水位",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FFB8",
                    "accuracy": 3,
                    "description": "大坝渗流点3水位",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                },
                {
                    "code": "FFB9",
                    "accuracy": 3,
                    "description": "大坝渗流点4水位",
                    "unit": "m",
                    "dataType": "Double",
                    "encode": "BCD"
                }
            ];
            // 转换为 Map，以 code 为 key
            const sl651IdentifierEnumMatchCode = new Map(SL651IdentifierEnumData.map(item => [item.code, item]));
            while (length > currentIndex) {
                // 编码要素
                let enCodeEle = content.substring(currentIndex, currentIndex + 2).toUpperCase();
                currentIndex += 2;
                // 数据定义
                let dataDef = content.substring(currentIndex, currentIndex + 2).toUpperCase();
                currentIndex += 2;
                // 判断是否是自定义编码要素
                if ("FF" === enCodeEle) {
                    // 把enCodeEle + dataDef 拼接到一起，因为enCodeEle和dataDef都只截取了2位（1个字节）刚好等于自定义编码4位（两个字节）
                    enCodeEle += dataDef;
                    // 重新向后截取数据定义
                    dataDef = content.substring(currentIndex, currentIndex + 2);
                    currentIndex += 2;
                }
                const sl651IdentifierEnum = sl651IdentifierEnumMatchCode.get(enCodeEle);
                let accuracy = sl651IdentifierEnum.accuracy;
                let description = sl651IdentifierEnum.description;
                let unit = sl651IdentifierEnum.unit;
                let dataType = sl651IdentifierEnum.dataType;
                let encode = sl651IdentifierEnum.encode;
                const parts = parseDataLength(dataDef);
                const byteLength = parts[0];
                const decimalPlaces = parts[1];
                let analyzeMsg = "";
                let val = "";
                switch (dataType) {
                    case "Double":
                        if ("F4" === enCodeEle) {
                            val = content.substring(currentIndex, currentIndex + (byteLength * 2));
                            const f4DataBytes = hexStringToByteArray(val);
                            for (let i = 0; i < 12; i++) {
                                let period = i + 1;          // 时段编号（1-12）
                                let minutes = i * 5;         // 起始分钟（0-55）
                                let currentByte = f4DataBytes[i];
                                let value = currentByte & 0xFF; // 转换为无符号整数
                                if (value === 0xFF) {
                                    analyzeMsg = "第" + period + "时段" + minutes + "分钟降雨量: -65535" + unit;
                                } else {
                                    let rainfall = (value * 0.1).toFixed(1); // 转换为毫米
                                    analyzeMsg = "第" + period + "时段" + minutes + "分钟降雨量: " + rainfall + unit;
                                }
                                analyzeMsgList.push(analyzeMsg);
                            }
                            analyzeMsg = description + ":" + val;
                        } else if ((/F5|F6|F7|F8|F9|FA|FB|FC/).test(enCodeEle)) {
                            val = content.substring(currentIndex, currentIndex + (byteLength * 2));
                            const dataBytes = hexStringToByteArray(val);
                            for (let i = 0; i < 24; i += 2) {
                                // 组合高8位和低8位（大端序）
                                let high = dataBytes[i] & 0xFF;
                                let low = dataBytes[i + 1] & 0xFF;
                                let value = (high << 8) | low;
                                // 计算时段和分钟
                                let period = (i / 2) + 1;
                                let minutes = (period - 1) * 5;
                                if (value === 0xFFFF) {
                                    analyzeMsg = "第" + period + "时段" + minutes + "分钟水位: -65535" + unit;
                                } else {
                                    let level = (value * 0.01).toFixed(2); // 单位转换
                                    analyzeMsg = "第" + period + "时段" + minutes + "分钟水位: " + level + unit;
                                }
                                analyzeMsgList.push(analyzeMsg);
                            }
                            analyzeMsg = description + ":" + val;
                        } else if ("FF02" === enCodeEle && regexRtuCode(measuringStation)) {
                            break;
                        } else if ("FF03" === enCodeEle && regexRtuCode(measuringStation)) {
                            val = contentSub(content, currentIndex, currentIndex + (byteLength * 2), null, null, "str");
                            analyzeMsg = "信号质量:" + val;
                        } else if ((/FF19|FF20|FF21|FF22|FF23|FF24|FF25|FF26|FF27/).test(enCodeEle)) {
                            let lhl = parseFloat(contentSub(content, currentIndex, currentIndex + byteLength, Math.pow(10, accuracy), accuracy, null));
                            analyzeMsg = description + "左: " + lhl + " " + unit;
                            analyzeMsgList.push(analyzeMsg);

                            let rhl = parseFloat(contentSub(content, currentIndex + byteLength, currentIndex + (byteLength * 2), Math.pow(10, accuracy), accuracy, null));
                            analyzeMsg = description + "右: " + rhl + " " + unit;
                        } else {
                            val = contentSub(content, currentIndex, currentIndex + (byteLength * 2), Math.pow(10, decimalPlaces), decimalPlaces, null);
                            analyzeMsg = description + ": " + val + " " + unit;
                        }
                        break;
                    case "String":
                        val = contentSub(content, currentIndex, currentIndex + (byteLength * 2), null, null, "str");
                        if (enCodeEle === "45") {
                            // 将十六进制转换为十进制
                            const value = parseInt(val, 16);
                            // 遍历 12 个位
                            for (let i = 0; i < 12; i++) {
                                const code = "BIT" + i;
                                const zt45HEnum = zt45HEnumMatchCode.get(code); // 假设 ZT45HEnum 是一个枚举类
                                const descMapKey = (value & (1 << i)) === 0 ? "0" : "1";
                                const descMapVal = zt45HEnum.descMap.get(descMapKey);

                                analyzeMsg = zt45HEnum.name() + ": " + descMapVal + " " + unit;
                                analyzeMsgList.push(analyzeMsg);
                            }
                        }
                        analyzeMsg = description + ": " + val + " " + unit;
                        break;

                    case "Integer":
                        val = contentSub(content, currentIndex, currentIndex + (byteLength * 2), null, null, "int");
                        analyzeMsg = description + ": " + val + " " + unit;
                        break;
                }
                currentIndex += (byteLength * 2);
                analyzeMsgList.push(analyzeMsg);
            }
            // 将报文内容填充到弹窗中
            analyzeMessage.textContent = analyzeMsgList.join(",");
            // 显示报文结果
            resultDivTwo.style.display = "block";
        }
    }
    const analyzeMessage = document.getElementById("analyzeMessage");
    const resultDivTwo = document.getElementById("resultTwo");
    // 第二个模态元素 end

    // 第三个模态元素 start
    const modalThree = document.getElementById("parseDataLengthModal");
    const btnThree = document.getElementById("parseDataLengthBtn");
    // 按钮点击时，显示弹窗
    btnThree.onclick = function () {
        modalThree.style.display = "block";
    }
    const spanThree = document.getElementById("closeModalThree");
    // 点击关闭按钮时关闭第三个模态弹窗
    spanThree.onclick = function () {
        modalThree.style.display = "none";
    }
    // 解析数据字节长度按钮
    const parseDataByteLengthBtn = document.getElementById("parseDataByteLengthBtn");
    // 解析数据字节长度按钮->点击事件
    parseDataByteLengthBtn.onclick = function () {
        // 获取解析数据字节长度
        const dataByteLength = document.getElementById("dataByteLength").value;
        // 检查必填字段是否为空
        if (!dataByteLength) {
            alert("请填写所有必填项！");
            return; // 退出函数
        }
        const parts = parseDataLength(dataByteLength);
        const byteLength = parts[0];
        const decimalPlaces = parts[1];
        const parseDataByteLengthResultTwo = document.getElementById("parseDataByteLengthResultTwo");
        parseDataByteLengthResultTwo.textContent = "数据字节长度: " + byteLength + ",小数位数: " + decimalPlaces;
        const parseDataByteLengthResult = document.getElementById("parseDataByteLengthResult");
        // 显示解析结果
        parseDataByteLengthResult.style.display = "block";
    }
    // 解析数据字节长度和小数位数按钮
    const parseDataByteLengthAndDecimalPlacesBtn = document.getElementById("parseDataByteLengthAndDecimalPlacesBtn");
    // 解析数据字节长度和小数位数按钮->点击事件
    parseDataByteLengthAndDecimalPlacesBtn.onclick = function () {
        // 获取解析数据字节长度
        const byteLengthTwo = document.getElementById("dataByteLengthTwo").value;
        const decimalPlaces = document.getElementById("decimalPlaces").value;
        // 检查必填字段是否为空
        if (!byteLengthTwo || !decimalPlaces) {
            alert("请填写所有必填项！");
            return; // 退出函数
        }
        const parseDataByteLengthAndDecimalPlacesResultTwo = document.getElementById("parseDataByteLengthAndDecimalPlacesResultTwo");
        parseDataByteLengthAndDecimalPlacesResultTwo.textContent = "数据字节长度: " + getHexFromDataLength(byteLengthTwo, decimalPlaces);
        const parseDataByteLengthAndDecimalPlacesResult = document.getElementById("parseDataByteLengthAndDecimalPlacesResult");
        // 显示解析结果
        parseDataByteLengthAndDecimalPlacesResult.style.display = "block";
    }
    // 第三个模态元素 end

    // CRC校验码计算函数
    function computeCRCCode(constructMsg) {
        // 将指定字符串以每两个字符分割转换为16进制形式
        const hexStr = HexString2Bytes(constructMsg);
        // 需要计算的数组
        const crc = calcCrc16(hexStr);
        return crc.toString(16).toLowerCase().padStart(4, '0');
    }

    // 将十六进制字符串转换为字节数组
    function HexString2Bytes(src) {
        if (!src || src.length === 0) {
            return null;
        }
        const ret = new Array(src.length / 2);  // 预分配字节数组
        for (let i = 0; i < src.length; i += 2) {
            ret[i / 2] = uniteBytes(src.charAt(i), src.charAt(i + 1));
        }
        return ret;
    }

    function uniteBytes(src0, src1) {
        const _b0 = parseInt(src0, 16) << 4;
        const _b1 = parseInt(src1, 16);
        return _b0 | _b1;
    }

    function calcCrc16(data) {
        return calcCrc16WithOffset(data, 0, data.length, 0xffff);
    }

    function calcCrc16WithOffset(data, offset, len, preval) {
        let ucCRCHi = (preval & 0xff00) >> 8;
        let ucCRCLo = preval & 0x00ff;
        let iIndex;
        for (let i = 0; i < len; ++i) {
            iIndex = (ucCRCLo ^ data[offset + i]) & 0x00ff;
            ucCRCLo = ucCRCHi ^ crc16_tab_h[iIndex];
            ucCRCHi = crc16_tab_l[iIndex];
        }
        return ((ucCRCHi & 0x00ff) << 8) | (ucCRCLo & 0x00ff) & 0xffff;
    }

    function formatDate(timestamp) {
        // 将时间戳拆分为各个部分
        const year = "20" + timestamp.substring(0, 2);
        const month = timestamp.substring(2, 4);
        const day = timestamp.substring(4, 6);
        const hour = timestamp.substring(6, 8);
        const minute = timestamp.substring(8, 10);
        const second = timestamp.substring(10, 12);
        // 返回格式化后的字符串
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    function parseDataLength(dataLengthHex) {
        // 将十六进制的字符串转换为二进制字符串
        const dataLength = parseInt(dataLengthHex, 16);
        const binaryString = dataLength.toString(2).padStart(8, '0');
        // 获取高5位作为字节数
        const byteLength = parseInt(binaryString.substring(0, 5), 2);
        // 获取低3位作为小数位数
        const decimalPlaces = parseInt(binaryString.substring(5, 8), 2);
        // 输出解析结果
        return [byteLength, decimalPlaces];
    }

    function getHexFromDataLength(dataLength, decimalPlaces) {
        // 检查参数合法性
        if (dataLength < 1 || dataLength > 31) {
            alert("数据字节长度必须在1到31之间");
            return;
        }
        if (decimalPlaces < 0 || decimalPlaces > 7) {
            alert("小数位数必须在0到7之间");
            return;
        }
        // 计算高 5 位（字节长度）
        const high5 = dataLength;  // 字节长度直接作为高5位的值
        // 计算低 3 位（小数位数）
        const low3 = decimalPlaces;  // 小数位数直接作为低3位的值
        // 组合高 5 位和低 3 位
        const result = (high5 << 3) | low3; // 高 5 位左移 3 位后和低 3 位合并
        // 转换为十六进制并返回
        return `0x${result.toString(16).padStart(2, '0').toUpperCase()}`; // 格式化为2位十六进制
    }

    function contentSub(content, numOne, numTwo, divide, format, type) {
        // 截取报文中的指定子字符串
        let val = content.substring(numOne, numTwo);
        // 检查字符串是否全部由 f 组成，+ 表示 至少 1 个 f。
        if (/^f+$/.test(val.substring(2))) {
            return "-65535";
        }
        // 如果 val 以 "ff" 开头，认为是负数并去除 "ff" 后进行处理
        if (val.substring(0, 2) === "ff") {
            val = val.substring(2);
            // 返回负数格式化结果
            return "-" + formatValue(val, divide, format, type);
        } else {
            // 正常情况下返回格式化的值
            return formatValue(val, divide, format, type);
        }
    }

    // HEX 字符串转字节数组
    function hexStringToByteArray(hexString) {
        const len = hexString。length;
        const byteArray = new Uint8Array(len / 2);
        for (let i = 0; i < len; i += 2) {
            byteArray[i / 2] = parseInt(hexString。substring(i， i + 2)， 16);
        }
        return byteArray;
    }

    function formatValue(val， divide， format， type) {
        // 如果需要进行除法操作
        if (divide !== null) {
            return (parseInt(val) / divide)。toFixed(format);
        }
        // 如果是整数类型格式
        if (type === "int") {
            return format ? parseInt(val)。toFixed(format) : parseInt(val);
        }
        // 默认返回字符串
        return val;
    }

    function regexRtuCode(measuringStation) {
        // 0040722029-李三尖水库（如意湖）、0000210011-大柳水库
        // 0040722028-丁东水库取水口、0040722022-夏津水库
        // 0040722005-龙门水库、0040722013-丁东水库北口
        // 0040722019-宁津水库、0040722006-相家河水库
        // 0040722023-瓦王闸、0040722017-308桥
        // 0040722027-二级沉沙池出口、0040722021-二级沉沙池入口
        // 0040722024-东北潘村、0040722009-三级沉沙池出口
        // 0040722015-三级沉沙池入口、0040722010-潘庄闸闸上
        // 0040722026-潘庄闸闸下
        // 将所有水库编码用 '|' 分隔，创建正则表达式
        const regex = /0040722029|0000210011|0040722028|0040722022|0040722005|0040722013|0040722019|0040722006|0040722023|0040722017|0040722027|0040722021|0040722024|0040722009|0040722015|0040722010|0040722026/;
        // 使用正则表达式匹配输入字符串
        return regex。test(measuringStation);
    }

    const crc16_tab_h = [
        0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0，
        0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1，
        0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0，
        0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0，
        0x80， 0x41， 0x00， 0xC1， 0x81， 0x40， 0x01， 0xC0， 0x80， 0x41， 0x01， 0xC0， 0x80， 0x41， 0x00， 0xC1， 0x81， 0x40
    ];

    const crc16_tab_l = [
        0x00， 0xC0， 0xC1， 0x01， 0xC3， 0x03， 0x02， 0xC2， 0xC6， 0x06， 0x07， 0xC7， 0x05， 0xC5， 0xC4， 0x04， 0xCC， 0x0C， 0x0D， 0xCD， 0x0F， 0xCF， 0xCE， 0x0E， 0x0A， 0xCA， 0xCB， 0x0B， 0xC9， 0x09， 0x08， 0xC8， 0xD8， 0x18， 0x19， 0xD9， 0x1B， 0xDB， 0xDA， 0x1A， 0x1E， 0xDE， 0xDF， 0x1F， 0xDD， 0x1D， 0x1C， 0xDC， 0x14， 0xD4， 0xD5， 0x15， 0xD7， 0x17， 0x16， 0xD6， 0xD2， 0x12，
        0x13， 0xD3， 0x11， 0xD1， 0xD0， 0x10， 0xF0， 0x30， 0x31， 0xF1， 0x33， 0xF3， 0xF2， 0x32， 0x36， 0xF6， 0xF7， 0x37， 0xF5， 0x35， 0x34， 0xF4， 0x3C， 0xFC， 0xFD， 0x3D， 0xFF， 0x3F， 0x3E， 0xFE， 0xFA， 0x3A， 0x3B， 0xFB， 0x39， 0xF9， 0xF8， 0x38， 0x28， 0xE8， 0xE9， 0x29， 0xEB， 0x2B， 0x2A， 0xEA， 0xEE， 0x2E， 0x2F， 0xEF， 0x2D， 0xED， 0xEC， 0x2C， 0xE4， 0x24， 0x25， 0xE5， 0x27， 0xE7，
        0xE6， 0x26， 0x22， 0xE2， 0xE3， 0x23， 0xE1， 0x21， 0x20， 0xE0， 0xA0， 0x60， 0x61， 0xA1， 0x63， 0xA3， 0xA2， 0x62， 0x66， 0xA6， 0xA7， 0x67， 0xA5， 0x65， 0x64， 0xA4， 0x6C， 0xAC， 0xAD， 0x6D， 0xAF， 0x6F， 0x6E， 0xAE， 0xAA， 0x6A， 0x6B， 0xAB， 0x69， 0xA9， 0xA8， 0x68， 0x78， 0xB8， 0xB9， 0x79， 0xBB， 0x7B， 0x7A， 0xBA， 0xBE， 0x7E， 0x7F， 0xBF， 0x7D， 0xBD， 0xBC， 0x7C， 0xB4， 0x74，
        0x75， 0xB5， 0x77， 0xB7， 0xB6， 0x76， 0x72， 0xB2， 0xB3， 0x73， 0xB1， 0x71， 0x70， 0xB0， 0x50， 0x90， 0x91， 0x51， 0x93， 0x53， 0x52， 0x92， 0x96， 0x56， 0x57， 0x97， 0x55， 0x95， 0x94， 0x54， 0x9C， 0x5C， 0x5D， 0x9D， 0x5F， 0x9F， 0x9E， 0x5E， 0x5A， 0x9A， 0x9B， 0x5B， 0x99， 0x59， 0x58， 0x98， 0x88， 0x48， 0x49， 0x89， 0x4B， 0x8B， 0x8A， 0x4A， 0x4E， 0x8E， 0x8F， 0x4F， 0x8D， 0x4D，
        0x4C， 0x8C， 0x44， 0x84， 0x85， 0x45， 0x87， 0x47， 0x46， 0x86， 0x82， 0x42， 0x43， 0x83， 0x41， 0x81， 0x80， 0x40
    ];
