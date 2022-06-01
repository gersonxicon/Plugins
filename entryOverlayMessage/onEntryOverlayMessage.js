/**
 * Send Message to users
 *
 * Displays information from admin to everyone in the space.
 *
 * @author gersonxicon
 */
 module.exports = class adminInformationPlugin extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.overlay-info' }
    static get name()           { return 'Overlay Information' }
    static get description()    { return 'Displays overlay information to users in the space.' }

	userName = '';
	messageType = 'global';
	userId = '';
	

    /** Called on load event */
    async onLoad() {
		this.userName = await this.user.getDisplayName();
		this.userId = await this.user.getID();
					
		// Register personal message/alert
		const usrMenu = await this.menus.register({
            id: 'EYFoundry.admin-informationuser',
            title: 'Send Info',
            section: 'usermenu',
            adminOnly: true,
			currentUser: true,
            icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sbnM6c3ZnanM9Imh0dHA6Ly9zdmdqcy5jb20vc3ZnanMiIHZlcnNpb249IjEuMSIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHg9IjAiIHk9IjAiIHZpZXdCb3g9IjAgMCAzMiAzMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgY2xhc3M9IiI+PGc+PHBhdGggeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkPSJtNCAyM2g4YTEgMSAwIDAgMCAwLTJoLThhMS4wMDEzIDEuMDAxMyAwIDAgMSAtMS0xdi0xMi4yNTlsOS40ODgzIDUuNTM0OWEzLjEyMzUgMy4xMjM1IDAgMCAwIDMuMDIzNCAwbDkuNDg4My01LjUzNDl2Mi4yNTlhMSAxIDAgMCAwIDIgMHYtNGEzLjA1IDMuMDUgMCAwIDAgLTIuMzk3LTIuOTM4OCAyLjk5MzEgMi45OTMxIDAgMCAwIC0uNjAzLS4wNjEyaC0yMGEzLjA2MjIgMy4wNjIyIDAgMCAwIC0zIDN2MTRhMy4wMDMzIDMuMDAzMyAwIDAgMCAzIDN6bTAtMThoMjBhLjk4NzkuOTg3OSAwIDAgMSAuODUzNi41MTFsLTEwLjM1IDYuMDM3M2ExIDEgMCAwIDEgLTEuMDA3OCAwbC0xMC4zNDk0LTYuMDM3M2EuOTg3OS45ODc5IDAgMCAxIC44NTM2LS41MTF6IiBmaWxsPSIjY2VjZWNlIiBkYXRhLW9yaWdpbmFsPSIjMDAwMDAwIiBjbGFzcz0iIi8+PHBhdGggeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkPSJtMjMgMTNhOCA4IDAgMSAwIDggOCA4LjAwOTIgOC4wMDkyIDAgMCAwIC04LTh6bTAgMTRhNiA2IDAgMSAxIDYtNiA2LjAwNjYgNi4wMDY2IDAgMCAxIC02IDZ6IiBmaWxsPSIjY2VjZWNlIiBkYXRhLW9yaWdpbmFsPSIjMDAwMDAwIiBjbGFzcz0iIi8+PGNpcmNsZSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGN4PSIyMyIgY3k9IjI1IiByPSIxIiBmaWxsPSIjY2VjZWNlIiBkYXRhLW9yaWdpbmFsPSIjMDAwMDAwIiBjbGFzcz0iIi8+PHBhdGggeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkPSJtMjMgMTZhMSAxIDAgMCAwIC0xIDF2NWExIDEgMCAwIDAgMiAwdi01YTEgMSAwIDAgMCAtMS0xeiIgZmlsbD0iI2NlY2VjZSIgZGF0YS1vcmlnaW5hbD0iIzAwMDAwMCIgY2xhc3M9IiIvPjwvZz48L3N2Zz4K',
            action: e => this.onUserMenuPress(e)
        });
		
        // Register global button
        this.menus.register({
            id: 'EYFoundry.admin-information',
            text: 'Send Info',
            section: 'admin-panel',
            adminOnly: true,
            icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sbnM6c3ZnanM9Imh0dHA6Ly9zdmdqcy5jb20vc3ZnanMiIHZlcnNpb249IjEuMSIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHg9IjAiIHk9IjAiIHZpZXdCb3g9IjAgMCAzMiAzMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgY2xhc3M9IiI+PGc+PHBhdGggeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkPSJtNCAyM2g4YTEgMSAwIDAgMCAwLTJoLThhMS4wMDEzIDEuMDAxMyAwIDAgMSAtMS0xdi0xMi4yNTlsOS40ODgzIDUuNTM0OWEzLjEyMzUgMy4xMjM1IDAgMCAwIDMuMDIzNCAwbDkuNDg4My01LjUzNDl2Mi4yNTlhMSAxIDAgMCAwIDIgMHYtNGEzLjA1IDMuMDUgMCAwIDAgLTIuMzk3LTIuOTM4OCAyLjk5MzEgMi45OTMxIDAgMCAwIC0uNjAzLS4wNjEyaC0yMGEzLjA2MjIgMy4wNjIyIDAgMCAwIC0zIDN2MTRhMy4wMDMzIDMuMDAzMyAwIDAgMCAzIDN6bTAtMThoMjBhLjk4NzkuOTg3OSAwIDAgMSAuODUzNi41MTFsLTEwLjM1IDYuMDM3M2ExIDEgMCAwIDEgLTEuMDA3OCAwbC0xMC4zNDk0LTYuMDM3M2EuOTg3OS45ODc5IDAgMCAxIC44NTM2LS41MTF6IiBmaWxsPSIjY2VjZWNlIiBkYXRhLW9yaWdpbmFsPSIjMDAwMDAwIiBjbGFzcz0iIi8+PHBhdGggeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkPSJtMjMgMTNhOCA4IDAgMSAwIDggOCA4LjAwOTIgOC4wMDkyIDAgMCAwIC04LTh6bTAgMTRhNiA2IDAgMSAxIDYtNiA2LjAwNjYgNi4wMDY2IDAgMCAxIC02IDZ6IiBmaWxsPSIjY2VjZWNlIiBkYXRhLW9yaWdpbmFsPSIjMDAwMDAwIiBjbGFzcz0iIi8+PGNpcmNsZSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGN4PSIyMyIgY3k9IjI1IiByPSIxIiBmaWxsPSIjY2VjZWNlIiBkYXRhLW9yaWdpbmFsPSIjMDAwMDAwIiBjbGFzcz0iIi8+PHBhdGggeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkPSJtMjMgMTZhMSAxIDAgMCAwIC0xIDF2NWExIDEgMCAwIDAgMiAwdi01YTEgMSAwIDAgMCAtMS0xeiIgZmlsbD0iI2NlY2VjZSIgZGF0YS1vcmlnaW5hbD0iIzAwMDAwMCIgY2xhc3M9IiIvPjwvZz48L3N2Zz4K',
            action: this.onGlobalMenuPress.bind(this)
        });
		// Register iframe in info panel
		this.menus.register({
		  section: 'infopanel',
            panel: {
                iframeURL: this.paths.absolute('./popUp.html'),
                width: 150,
                height: 100
            }
		});
		
		// Register component
        this.objects.registerComponent(plugVelocityBase, {
            id: 'EYFoundry-onEntryOverlayMessage',
            name: 'EntryOverlayMessaging',
            description: "Display custom messages to user on entry of object",
            settings: [
                { id: 'lbl-onEnter', type: 'label', value: "onEnter Message" },
                { id: 'txt-onEnter', type: 'text'},
				{ id: 'lbl-firstMessage', type: 'label', value: "First Message" },
				{ id: 'txt-firstMessage', type: 'text'},
				{ id: 'lbl-secondMessage', type: 'label', value: "Second Message" },
				{ id: 'txt-secondMessage', type: 'text'},
				{ id: 'sel-type', name: 'Alert Type', type: 'select', values: ['Alert', 'Iframe'] }				
            ]
        });
		
		// Register close panel button
		const hidePnl = await this.menus.register({
            id: 'EYFoundry.user-hidepanel',
            title: 'Close Panel',
			text: 'Close Panel',
            section: 'controls',
            adminOnly: false,
			currentUser: true,
            icon: this.paths.absolute('./hide.png'),
            action: e => this.onHidePanel(e)
        });
		
    }
	
	/** Called when the user presses the Send Info button from Admin menu */
    async onHidePanel(e) {
        // Send message
        this.messages.send({ action: 'show-msg', text: 'hide' }, false, this.userId);
    }
	
	/** Called when the user presses the Send Info button from Admin menu */
    async onUserMenuPress(usr) {
        // Ask user for message
        const msg = await this.menus.prompt({
            title: 'Send Information',
            text: 'This message will be displayed only to the selected user.',
			placeholder: 'Enter a message.'
        })

        // No message to send
        if (!msg) {
            return
        }

        // Send message
        this.messages.send({ action: 'show-msg', text: msg }, false, usr.user.id)

    }
	
    /** Called when the user presses the Send Info button from Admin menu */
    async onGlobalMenuPress() {

        // Ask user for message
        const msg = await this.menus.prompt({
            title: 'Send Information',
            text: 'This message will be displayed to everyone in the space.',
			placeholder: 'Enter a message.'
        })

        // No message to send
        if (!msg) {
            return
        }

        // Send message
        this.messages.send({ action: 'show-msg', text: msg }, true)

    }

    /** When an user receives the message */
    onMessage(msg) {	
        // Check message type
        if (msg.action === 'show-msg')
		{
            this.onShowMessage(msg);
		}
		else if(msg.action === 'overlay-load')
		{
			this.onSetUserName(this.userName);
		}
		else if(msg.action === 'obj-show-msg')
		{
            this.onObjShowMessage(msg);
		}

    }

    /** When we receive a message, display it */
    onShowMessage(msg) {
		// Show message in iframe
        this.menus.postMessage({ action: 'update-message', msg: msg.text });
    }
	
	
    /** When we receive a message, display it */
    onObjShowMessage(msg) {
		// Show message in iframe
        this.menus.postMessage({ action: 'obj-update-message', msg: msg.text });
    }
	
	onSetUserName(user) {
		// Show message in iframe
        this.menus.postMessage({ action: 'set-username', msg: user });
    }

}

class plugVelocityBase extends BaseComponent {
   
    isPreviousInside = false
    isChecking = false
    instanceID = "string"	
	userId = '';

    async onLoad(){
		this.userId = await this.plugin.user.getID();
				
        //Generate instanceID
        this.instanceID = Math.random().toString(36).substring(2);

        this.timer = setInterval(this.checkIfWithin.bind(this), 1000);
	}
	
	onObjectUpdated(newFields)
	{
		console.log(newFields)
	}
  
    onUnload(){          
		clearInterval(this.Timer)
    }
		
    async checkIfWithin(){
       if (this.isChecking){return}

       this.isChecking = true

         // Get user position
         let userPos = await this.plugin.user.getPosition()
		 
         // Check if we are inside this object
         let minX = this.fields.world_center_x - this.fields.world_bounds_x/2
         let minY = this.fields.world_center_y - this.fields.world_bounds_y/2
         let minZ = this.fields.world_center_z - this.fields.world_bounds_z/2
         let maxX = this.fields.world_center_x + this.fields.world_bounds_x/2
         let maxY = this.fields.world_center_y + this.fields.world_bounds_y/2
         let maxZ = this.fields.world_center_z + this.fields.world_bounds_z/2
         let isNowInside = userPos.x >= minX && userPos.x <= maxX && userPos.y >= minY && userPos.y <= maxY && userPos.z >= minZ && userPos.z <= maxZ
        
         if (!this.isPreviousInside && isNowInside) //outside and now inside
         {
			//user has entered
			this.isPreviousInside = true;

			//display alert
			await this.plugin.menus.alert(this.getField('txt-onEnter'), 'Information', 'success');
			// Send message
			this.plugin.messages.send({ action: 'show-msg', text: this.getField('txt-firstMessage') }, false, this.userId);
			this.plugin.messages.send({ action: 'obj-show-msg', text: this.getField('txt-secondMessage') }, false, this.userId);
			
		 }

		 if( this.isPreviousInside && !isNowInside) //inside and now outside
         {
                //user has exited
                this.isPreviousInside = false;
		 }
         this.isChecking = false           
    } 
}
