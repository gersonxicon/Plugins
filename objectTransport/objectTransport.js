/**
 * Allows objects to transport user based on proximity
 *
 *
 * @author gersonxicon
 */
/** List of active objects */
let activeObjects = [];
let iframeID = null;

 module.exports = class showHideObjectEvent extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.transport-object' }
    static get name()           { return 'Move object on event.' }
    static get description()    { return 'Move object on event.' }

    /** Timer used to check for updates */
    timer = null;
    objectID = '';

    /** Called on load event */
    async onLoad() {
	    // Register Object component
        this.objects.registerComponent(Obj, {
            id: 'EyFoundry.TransportObject',
            name: 'Transport Object',
            description: 'Transport Object based on event.',
            settings: [
                { type: 'text', id: 'xLocation', name: 'X Location', help: 'Set X location to transport.' },
                { type: 'text', id: 'yLocation', name: 'Y Location', help: 'Set Y location to transport.' },
                { type: 'text', id: 'zLocation', name: 'Z Location', help: 'Set Z location to transport.' },
                { type: 'text', id: 'radius', name: 'Radius', help: 'Set radius to teleport (integer).' }
            ]
        });		

        // Stop here if on the server
        if (this.isServer) {
            return;
        }

        // Start a distance check timer
        this.timer = setInterval(this.onTimer.bind(this), 200);
    }	

    /** Called on a regular interval */
    async onTimer() {

        // Get position of user
        const userPos = await this.user.getPosition()

        // Run each timer
        for (let activeObj of activeObjects) {
            activeObj.onTimer(userPos);
        }

    }

    onMessage(msg) {	
        if(msg.action === 'ok'){
            this.objectID = msg.obj;
            this.transport();			
		}
    }

    transport(){
		try {
            //Move object
            for (let activeObj of activeObjects) {
                if(activeObj.objectID === this.objectID)
                {
                    activeObj.moveObject();
                }
            }		
		}
		catch (e) {}
		this.menus.closePopup(iframeID);
	}
}


/**
 * Component that allows an object to be interactive.
 */
 class Obj extends BaseComponent {  
    available = false;

     /** Called when the component is loaded */ 
    async onLoad() {
        // Store it
        activeObjects.push(this);
    }

    /** When an user receives the message */
    onMessage(msg) {	
        // Check message type
		if(msg.action === 'show-msg')
        {
            // Show message in iframe
            this.plugin.menus.postMessage({ action: 'update-message', msg: msg.text, object: msg.obj });
        }
    }

    /** Called on a regular basis to check if user can see the object */
    onTimer(userPos) {

        const x = this.fields.x       || 0
        const y = this.fields.height  || 0
        const z = this.fields.y       || 0

        // Calculate distance between the user and object
        const distance = Math.sqrt((x - userPos.x) ** 2 + (y - userPos.y) ** 2 + (z - userPos.z) ** 2)

        // Stop if far away
        if (distance > 2) {    
            this.available = false;       
            return;
        }
       
        // Notify other users that we claimed it
        this.available = true;
    }

    /** Called when the object is clicked */
    async onClick() {
        if(this.available)
        {
            this.playSound();
            this.sendMessage({ action: 'show-msg', text: 'Ready to take a ride!', obj: this.objectID },  false, this.userId);        		
            iframeID = await this.plugin.menus.displayPopup({ id: 'EYFoundry.iframe', title: 'Welcome!', panel: { iframeURL: this.paths.absolute('./popUp.html'), width: 400, height: 270 } });
        }
    }

    playSound(){
        const sound = this.paths.absolute('./horse.mp3');
     
        let volume = 0.2;
        if (sound) {
            this.plugin.audio.play(sound, { volume: volume })
        }
    }

    async moveObject(newX,newY,newZ){
         // Get object position
         const x = this.fields.x       || 0
         const y = this.fields.height  || 0
         const z = this.fields.y       || 0

		try {		
            let newX = parseFloat(this.getField('xLocation'));
            let newY = parseFloat(this.getField('yLocation'));
			let newZ = parseFloat(this.getField('zLocation'));	
            //Setting user position
            this.plugin.user.setPosition(newX + parseFloat(this.getField('radius')), newY, newZ + parseFloat(this.getField('radius')),false);	
            await new Promise(r => setTimeout(r, 1000));
            //Setting object position
            this.setObjectPosition(newX,newY,newZ);            
            
            await new Promise(r => setTimeout(r, 2000));
            //Return to original position           
            this.setObjectPosition(x,y,z);	

		}
		catch (e) {}		
	}

    setObjectPosition(x,y,z){
        this.plugin.objects.update(
            this.objectID,
            {
                position: [ x, y, z ]                    
            },
            false);		
    }
 }
