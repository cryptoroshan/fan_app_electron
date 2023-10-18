import PySimpleGUI as sg


def ipBox(key, default): return sg.I(default, size=(3, 1), key=key, pad=(0, 2))
def macBox(key, default): return sg.I(default, size=(2, 1), key=key, pad=(0, 2))

#typedef struct {
#	uint8_t version;
#	bool dhcp;
#	uint8_t IP_ADDRESS[4];
#	uint8_t NETMASK_ADDRESS[4];
#	uint8_t GATEWAY_ADDRESS[4];
#	uint8_t MACAddr[6];
#} FanFactory;

def genBinary(values, fileName):
    data = bytearray()
    data.append(0x10)
    data.append(0x01 if values['dhcp'] == 'Automatic DHCP'  else 0x00)
    data.append(int(values['ip0']))
    data.append(int(values['ip1']))
    data.append(int(values['ip2']))
    data.append(int(values['ip3']))

    data.append(int(values['mk0']))
    data.append(int(values['mk1']))
    data.append(int(values['mk2']))
    data.append(int(values['mk3']))

    data.append(int(values['gw0']))
    data.append(int(values['gw1']))
    data.append(int(values['gw2']))
    data.append(int(values['gw3']))

    data.extend(bytearray.fromhex(values['mc0']))
    data.extend(bytearray.fromhex(values['mc1']))
    data.extend(bytearray.fromhex(values['mc2']))
    data.extend(bytearray.fromhex(values['mc3']))
    data.extend(bytearray.fromhex(values['mc4']))
    data.extend(bytearray.fromhex(values['mc5']))

    with open(fileName, "wb") as binary_file:
        binary_file.write(data)


ip_frame = [
          [sg.T('IP Address '),ipBox('ip0', '192'), sg.T('.'), ipBox('ip1', '168'), sg.T('.'),  ipBox('ip2', '1'), sg.T('.'), ipBox('ip3', '10')],
          [sg.T('Net Mask   '),ipBox('mk0', '255'), sg.T('.'), ipBox('mk1', '255'), sg.T('.'),  ipBox('mk2', '255'), sg.T('.'), ipBox('mk3', '0')],
          [sg.T('Gateway    '),ipBox('gw0', '192'), sg.T('.'), ipBox('gw1', '168'), sg.T('.'),  ipBox('gw2', '1'), sg.T('.'), ipBox('gw3', '1')],
          ]

layout = [
          [sg.T(' Method      '), sg.Combo(['Automatic DHCP', 'Static IP'], default_value='Static IP', key='dhcp')],
          [sg.pin(sg.Column(ip_frame, key='ipframe'))],
          [sg.T(' Mac Address '), macBox('mc0', '00'), sg.T(':'), macBox('mc1', '00'), sg.T(':'), macBox('mc2', '00'), sg.T(':'), macBox('mc3', '00'), sg.T(':'), macBox('mc4', '00'), sg.T(':'), macBox('mc5', '00')],
          [sg.B('Generate', key='btnGen'), sg.B('Exit')]]

window = sg.Window('Window Title', layout, return_keyboard_events=True)

while True:             # Event Loop
    event, values = window.read()
    if event == sg.WIN_CLOSED or event == 'Exit':
        break
    elif event == "btnGen":
        genBinary(values, "manufacture.bin")
        

    window['ipframe'].Update(visible=(False if values['dhcp'] == 'Automatic DHCP'  else True))
window.close()