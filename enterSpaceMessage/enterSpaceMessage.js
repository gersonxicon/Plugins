/**
 * Popup Message
 *
 * Displays a message, in a popup, to a user when they enter a space.
 *
 *
 * @license MIT
 * @author gersonxicon
 */
module.exports = class enterSpaceMessage extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.enterspace-message' }
    static get name()           { return 'Space Message' }
    static get description()    { return 'Display a message, in a popup, to users when they enter the space.' }

	userName = '';

    /** Called when the plugin is loaded */
    async onLoad() {
		this.userName = await this.user.getDisplayName();
		
        // Allow message to be configured
        this.menus.register({
            id: 'EYFoundry.enterspace-message-config',
            section: 'plugin-settings',
            panel: {
                fields: [
                    { type: 'section', name: 'Space Message' },
                    { type: 'checkbox', id: 'enabled', name: 'Enabled', help: 'When enabled, the popup will be shown.' },
                    { type: 'text', id: 'title', name: 'Title', help: 'Title of the message.' },
                    { type: 'text', id: 'text', name: 'Text', help: 'Text to display in the message.' },
					{ type: 'text', id: 'btnYes', name: 'Yes Button Text', help: 'Text to display in Yes Button.' },
					{ type: 'text', id: 'btnNo', name: 'No Button Text', help: 'Text to display in No Button.' },
					{ type: 'text', id: 'yesXLocation', name: 'X Location', help: 'Set X location to transport on affirmative response.' },
					{ type: 'text', id: 'yesYLocation', name: 'Y Location', help: 'Set Y location to transport on affirmative response.' },
					{ type: 'text', id: 'yesZLocation', name: 'Z Location', help: 'Set Z location to transport on affirmative response.' },
					{ type: 'text', id: 'noMessage', name: 'Negative Response Text', help: 'Text to display on negative response.' }
                ]
            }
        })

        // Show message now, if enabled
        if (this.getField('enabled')) {
			// Send message
			const iframe = await this.menus.register({ 
				id: 'EYFoundry.iframe', 
				title: this.getField('title'), 
				section: 'overlay-top',
				panel: { 
					iframeURL: this.paths.absolute('./popUp.html'),
					zIndex: 2,
                	moveWhenPanelActive: false,
					width: 200, 
					height: 230 
				} });
			this.messages.send({ action: 'show-msg', text: this.getField('text') }, true);
		}

    }
	
	/** When an user receives the message */
    onMessage(msg) {	
        // Check message type
		if(msg.action === 'load')
		{
			this.onShowMessage(msg);
		}
		else if(msg.action === 'yesResponse'){
			try {
				this.user.setPosition(parseFloat(this.getField('yesXLocation')), parseFloat(this.getField('yesYLocation')), parseFloat(this.getField('yesZLocation')),false);
			}
			catch (e) {}
			this.closePopUp();
		}
		else if(msg.action === 'noResponse'){
			this.menus.alert(this.getField('noMessage'), 'Information', 'info');
			this.closePopUp();
		}		
    }
	
	/** When we receive a message, display it */
    onShowMessage(msg) {		 
		// Show message in iframe
        this.menus.postMessage({ action: 'update-message', userName: this.userName, msg: this.getField('text'), yesBtn: this.getField('btnYes'), noBtn: this.getField('btnNo') });
    }
	
	closePopUp(){
		//Action to close
		this.menus.unregister('EYFoundry.iframe');
	}
}
