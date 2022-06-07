/**
 *
 * Shows a message on Ctl+I and transports user to a defined location
 *
 * @license MIT
 * @author gersonxicon
 */
module.exports = class KeyPressMessage extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry-onKeyPressMessage' }
    static get name()           { return 'KeyPressMessaging' }
    static get description()    { return 'Display custom messages to user on key press' }

	iframeID = null;

    /** Called when the plugin is loaded */
    onLoad() {
		// Keys Hook
		this.hooks.addHandler('controls.key.down', this.callMessage);   
		
		// Do setup
		this.setup();
    }
	
	   /** Called when the plugin is unloaded */
    onUnload() {
		// Keys Hook
		this.hooks.removeHandler('controls.key.down', this.callMessage);		
	}
	
	/** Do setup */
    async setup(){
		 // Allow message to be configured
        this.menus.register({
            id: 'EYFoundry.key-message',
            section: 'plugin-settings',
            panel: {
                fields: [
                    { type: 'section', name: 'KeyPress Message' },
                    { type: 'checkbox', id: 'enabled', name: 'Enabled', help: 'When enabled, the popup will be shown.' },
					{ type: 'checkbox', id: 'sound', name: 'Sound', help: 'When enabled, sound will be avaiable on teleport.' },
                    { type: 'text', id: 'title', name: 'Title', help: 'Title of the message.' },
                    { type: 'text', id: 'text', name: 'Text', help: 'Text to display in the message.' },
					{ type: 'text', id: 'btnText', name: 'Button Text', help: 'Text to display in the OK button.' },
					{ type: 'text', id: 'xLocation', name: 'X Location', help: 'Set X location to transport.' },
					{ type: 'text', id: 'yLocation', name: 'Y Location', help: 'Set Y location to transport.' },
					{ type: 'text', id: 'zLocation', name: 'Z Location', help: 'Set Z location to transport.' },
					{ type: 'text', id: 'radius', name: 'Radius', help: 'Set radius to teleport (integer).' }
                ]
            }
        })
	}
	
	/** When an user receives the message */
    onMessage(msg) {	
        // Check message type
		if(msg.action === 'load')
		{
			this.onShowMessage(msg);
		}
		else if(msg.action === 'ok'){
			this.transport();
		}
    }
	
	callMessage = async e => {
		//If enabled then catch key event
		if (this.getField('enabled')) {
			if (e.ctrlKey === true && (e.key === 'i' || e.key === 'I')) {
				this.iframeID = await this.menus.displayPopup({ id: 'EYFoundry.iframe', title: this.getField('title'), panel: { iframeURL: this.paths.absolute('./popUp.html'), width: 400, height: 270 } });
				this.messages.send({ action: 'show-msg', text: this.getField('text') }, true);			
			} else {
				return;
			}
		}
    }
	
	/** When we receive a message, display it */
    onShowMessage(msg) {		 
		// Show message in iframe
        this.menus.postMessage({ action: 'update-message', msg: this.getField('text'), okBtn: this.getField('btnText')});
    }
	
	transport(){
		try {
			this.playSound();
			let x = parseFloat(this.getField('xLocation')) + parseFloat(this.randomRadius());
			let z = parseFloat(this.getField('zLocation')) + parseFloat(this.randomRadius());	
			this.user.setPosition(x, parseFloat(this.getField('yLocation')), z,false);			
		}
		catch (e) {}
		this.closePopUp();
	}

	playSound(){
	   	const sound = this.paths.absolute('./teleport.mp3');
		
		let volume = 0.2;
		if (sound && this.getField('sound')) {
			this.audio.play(sound, { volume: volume })
		}
    }

	closePopUp(){
		//Action to close
		this.menus.closePopup(this.iframeID);
	}

	randomRadius(){
		let radius = this.getField('radius') ?? 0;
		return Math.floor(Math.random() * parseInt(radius)) + 1;
	}
}
