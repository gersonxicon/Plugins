/**
 * Allows to show/hide objects on event
 *
 *
 * @author gersonxicon
 */
/** List of active objects */
let activeObjects = [];

 module.exports = class showHideObjectEvent extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.showHide-object' }
    static get name()           { return 'Show/Hide object on event' }
    static get description()    { return 'Show/Hide object on click.' }

    /** Timer used to check for updates */
    timer = null;

    /** Called on load event */
    async onLoad() {
	    // Register Object component
        this.objects.registerComponent(Obj, {
        id: 'EyFoundry.ShowHideObject',
        name: 'Show Hide Object',
        description: 'Show Hide Object based on event.'
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
}


/**
 * Component that allows an object to be interactive.
 */
 class Obj extends BaseComponent {

    userId = '';

    /** Called when the component is loaded */
    async onLoad() {
        this.userId = await this.plugin.user.getID();
        // Generate instance ID
        this.instanceID = Math.random().toString(36).substr(2);

        // Store it
        activeObjects.push(this);
    }

     /** Called when a message is received */
     onMessage(msg) {
        // Check if it's a claiming message
        if (msg.action === 'found') {
            // Show it
            
            if (!this.hasPickedUp) {
                this.playSound();
            }
            this.hasPickedUp = true;
            this.plugin.objects.update(this.objectID, { hidden: false }, true);
        }
        else if (msg.action === 'hide') {
            // Hide it
            this.plugin.objects.update(this.objectID, { hidden: true }, true);
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
            this.sendMessage({ action: 'hide' },  false, this.userId);
            return;
        }
       
        // Notify other users that we claimed it
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
