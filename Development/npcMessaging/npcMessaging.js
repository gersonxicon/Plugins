/**
 * Allows to convert an object to a NPC message
 *
 *
 * @author gersonxicon
 */
/** List of NPC objects */
let activeObjects = [];
let iframeID = null;
let imagesList = '';

 module.exports = class npcMessaginPlugin extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.npc-object' }
    static get name()           { return 'Show NPC Message.' }
    static get description()    { return 'Show NPC Message on proximity and click.' }

    /** Timer used to check for updates */
    timer = null;

    /** Called on load event */
    async onLoad() {
	    // Register Object component
        this.objects.registerComponent(Obj, {
        id: 'EyFoundry.NPCMessage',
        name: 'Create NPC from object.',
        description: 'Convert this object to a NPC.',
        settings: [
            { type: 'text', id: 'activationDistance', name: 'Activation Distance', help: 'Set activation distance for object interaction (integer).' },
            { type: 'text', id: 'urlImages', name: 'URL Images', help: 'Set images URLs separated by semicolon (http://image1.png;htttp://image2.png).' }            
        ]
        });		

        // Stop here if on the server
        if (this.isServer) {
            return;
        }

        // Start a distance check timer
        this.timer = setInterval(this.onTimer.bind(this), 200);
    }	

    /** Called when the plugin is unloaded */
    onUnload() {

        // Remove timer
        if (this.timer) {
            clearInterval(this.timer)
        }
    }

    onMessage(msg) {	
        // Check for messages
        if(msg.action === 'ok'){
            this.menus.closePopup(iframeID);
        }
        else if(msg.action === 'panel-load')
        {
            this.setImagesURL(imagesList);
        }
    }

    setImagesURL(urls)
    {
        this.menus.postMessage({ action: 'set-urls', msg: urls },true);
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
}


/**
 * Component that allows an object to be interactive.
 */
 class Obj extends BaseComponent {
    
    userId = '';
    available = false;

    /** Called when the component is loaded */
    async onLoad() {
        this.userId = await this.plugin.user.getID();
        // Generate instance ID
        this.instanceID = Math.random().toString(36).substr(2);

        // Store it
        activeObjects.push(this);

        const sound = this.paths.absolute('./treasure.mp3');
        if (sound) {
            this.plugin.audio.preload(sound)
        }        
    }

     /** Called when a message is received */
     onMessage(msg) {
        // Check if it's a claiming message
        if (msg.action === 'found') {
            // Show it            
            if (!this.hasPickedUp) {
                this.showIframe();
            }   
            this.hasPickedUp = true;
        }        
    }

    /** Called when the object is clicked */
    onClick() {
        if (this.hasPickedUp && this.available) {
            this.showIframe();
        }  
    }

    async showIframe(){
        imagesList = this.getField('urlImages');
        iframeID = await this.plugin.menus.displayPopup({ id: 'EYFoundry.iframe', title: 'Welcome!', panel: { iframeURL: this.paths.absolute('./popUp.html'), width: 500, height: 500 } });
        this.playSound();
    }

     /** Called on a regular basis to check if user can see the object */
     onTimer(userPos) {

        const x = this.fields.x       || 0
        const y = this.fields.height  || 0
        const z = this.fields.y       || 0

        // Calculate distance between the user and object
        const distance = Math.sqrt((x - userPos.x) ** 2 + (y - userPos.y) ** 2 + (z - userPos.z) ** 2)

        const parameterDistance = parseInt(this.getField('activationDistance'));
        // Stop if far away
        if (distance > parameterDistance) {
            this.available = false;   
            this.sendMessage({ action: 'hide' },  false, this.userId);
            return;
        }
       
        this.available = true;
        // Send message when object is found
        this.sendMessage({ action: 'found' },  false, this.userId);
    }

    playSound(){
        const sound = this.paths.absolute('./treasure.mp3');
     
        let volume = 0.2;
        if (sound) {
            this.plugin.audio.play(sound, { volume: volume })
        }
    }
 }
