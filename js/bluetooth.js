$(document).ready(function()
{
	$('#Connect').on("click",() => ConnectBluetooth());
	$('#Disconnect').on("click",() => DisconnectBluetooth());
	
	//Execute a function when the user releases a key on the keyboard
	$('#commandbox').keyup((event) => EnterCommand(event));

	//disable controls
	$('#commandbox').prop("disabled", true);
	$('#Disconnect').prop("disabled", true);
});

const mainService = '09b0d0a5-f374-4051-a819-67c235f31438';
const characteristicReaderUUID = '09b0d0a6-f374-4051-a819-67c235f31438';	//read
const characteristicWriterUUID = '09b0d0a7-f374-4051-a819-67c235f31438'; 	//write
const descriptorUUID = '00002901-0000-1000-8000-00805f9b34fb';
let deviceCache = null;
let serverCache = null;
let serviceCache = null;
let characteristicReaderCache = null;
let characteristicWriterCache = null;
let descriptorCache = null;

async function ConnectBluetooth()
{
	try
	{
		deviceCache = await navigator.bluetooth.requestDevice({ filters: [{ services: [mainService] }] });

		//Set up event listener for when device gets disconnected.
  		deviceCache.addEventListener('gattserverdisconnected', this.onDisconnected);

		console.log('Connecting to GATT Server...');
		serverCache = await deviceCache.gatt.connect();

		console.log('Getting Services...');
		serviceCache = await serverCache.getPrimaryService(mainService);

		console.log('Getting Characteristics (Writer)...');
      	characteristicWriterCache = await serviceCache.getCharacteristic(characteristicWriterUUID);

		console.log('Getting Characteristics (Reader)...');
		characteristicReaderCache = await serviceCache.getCharacteristic(characteristicReaderUUID);

		console.log('Start Notifications (Reader)...');
		await characteristicReaderCache.startNotifications();

      	console.log('Add event listener...');
      	characteristicReaderCache.addEventListener('characteristicvaluechanged', this.onValueChanged);
    }
    catch(error)
    {
    	console.error(error);
    }

	
	$('#Disconnect').prop("disabled", deviceCache == null);
	$('#commandbox').prop("disabled", deviceCache == null);

	SendCommand("!stup 1");

	/*navigator.bluetooth.requestDevice({
	  filters: [{
	    services: ['09b0d0a5-f374-4051-a819-67c235f31438']
	  }]
	})
	.then(device =>
	{
  		console.log(device.name);

  		//Attempts to connect to remote GATT Server.
  		return device.gatt.connect();
	})
	.then(server => server.getPrimaryService('09b0d0a5-f374-4051-a819-67c235f31438'))
	.then(service => service.getCharacteristic('09b0d0a7-f374-4051-a819-67c235f31438'))
	.then(characteristic =>
	{
		const encoder = new TextEncoder('utf-8');
		const command = encoder.encode('?base');
		return characteristic.writeValue(command);
	})
	.then(_ => {
  		console.log('Energy expended has been reset.');
	})
	
	.catch(error => { console.error(error); });*/
}

async function DisconnectBluetooth()
{
	if(deviceCache != null)
		await deviceCache.gatt.disconnect();
}

function onDisconnected(event)
{
	const device = event.target;
	console.log(`Device ${device.name} is disconnected.`);

	//disable controls
	$('#commandbox').prop("disabled", true);
	$('#Disconnect').prop("disabled", true);
}

function EnterCommand(event)
{
	if(event.keyCode == 13)
	{
		var command = $('#commandbox').val();
		console.log('Command: ' + command);

		//clear the textbox
		$('#commandbox').val("");
		
		//send command
		SendCommand(command);
	}
}

function onValueChanged(event)
{
	const decoder = new TextDecoder();
	const value = decoder.decode(event.target.value);

	//parse data
	ParseJsonResponse(JSON.parse(value));
	console.log('Received ' + value);
}

function ParseJsonResponse(json)
{
	if(json.SU != null) //stup command
	{
		$("#DoseStatus").val(json.SU.AL);
		$("#DoseRate").val(json.SU.DR);
		$("#Counts").val(json.SU.CR);
		$("#TotalDose").val(json.SU.AD);
		$("#Neutrons").val(json.SU.NR);
	}
}

async function SendCommand(command)
{
  	const encoder = new TextEncoder();
	await characteristicWriterCache.writeValue(encoder.encode(command));
}

function sleep(ms)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}