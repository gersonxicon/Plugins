/**
 * 
 *
 * Allows to mark objects as collectable and coordinate between users what have been collected.
 *
 * @author gersonxicon
 */
/** List of active objects */
let activeCollectable = [];
 module.exports = class collectItemsPlugin extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.collect-items' }
    static get name()           { return 'Collect items' }
    static get description()    { return 'Allow to mark objects as collectable and keep track of collected ones.' }

    /** Timer used to check for updates */
    timer = null;
	userId = '';	

    /** Called on load event */
    async onLoad() {
		this.userId = await this.user.getID();
			
        this.registerOverlayPanel();

        // Register Object component
        this.objects.registerComponent(Obj, {
            id: 'EyFoundry.collectable-object',
            name: 'Mark object as collectable',
            description: 'Convert object to collectable item for the inventory.',
            settings: [
                { type: 'text', id: 'activationDistance', name: 'Activation Distance', help: 'Set activation distance for object interaction (integer).' },
                { type: 'text', id: 'objectName', name: 'Object Name', help: 'Set object name for this collectable item.' },
                { type: 'text', id: 'objectKey', name: 'Object Key', help: 'Set object key for this collectable item.' },
                { type: 'text', id: 'img', name: 'Image', help: 'Set image for item in overlay panel.' },
                { type: 'text', id: 'silImg', name: 'Placeholder image', help: 'Set silhouette image for item in overlay panel.' }
            ]
            });		

        // Stop here if on the server
        if (this.isServer) {
            return;
        }

        // Start a distance check timer
        this.timer = setInterval(this.onTimer.bind(this), 200);
    }
	
    registerOverlayPanel(){
        // Register iframe in info panel
		this.menus.register({
            id: 'EYFoundry.overlay-panel',
            section: 'infopanel',
              panel: {
                  iframeURL: this.paths.absolute('./popUp.html'),
                  width: 150,
                  height: 70
              }
          });
    }

    /** Called when the plugin is unloaded */
    onUnload() {
        // Remove timer
        if (this.timer) {
            clearInterval(this.timer)
        }
    }	

    /** When an user receives the message */
    onMessage(msg) {	
        // On iframe load
        if(msg.action === 'overlay-load'){
			this.setAllCollectables(msg);
		}
    }

    /** When we receive a message, display it */
    setAllCollectables(msg) {
        var images = [];
        for (let activeObj of activeCollectable) {
            var valueToPush = {};
            valueToPush.img = activeObj.img;
            valueToPush.objKey = activeObj.objKey;
            valueToPush.silImg = activeObj.silImg;
            images.push(valueToPush);
        }
		// Show message in iframe
        this.menus.postMessage({ action: 'set-collectables', imgs: images });
    }

    /** Called on a regular interval */
    async onTimer() {

        // Get position of user
        const userPos = await this.user.getPosition()

        // Run each timer
        for (let activeObj of activeCollectable) {
            activeObj.onTimer(userPos);
        }
    }
}

/**
 * Component that allows an object to be interactive.
 */
 class Obj extends BaseComponent {

    userId = '';
    userName = '';
    /** Door sound */
    sound = this.paths.absolute('./treasure.mp3');
    objectName = '';
    objectKey = '';
    img = '';
    silImg = '';

    /** Called when the component is loaded */
    async onLoad() {
        this.userId = await this.plugin.user.getID();
        this.userName = await this.plugin.user.getDisplayName();
        // Generate instance ID
        this.instanceID = Math.random().toString(36).substr(2);
        this.objectName = this.getField('objectName');
        this.objectKey = this.getField('objectKey');
        this.img = this.getField('img');
        this.silImg = this.getField('silImg');

        // Store it
        activeCollectable.push(this);

        if (this.doorSound) {
            this.plugin.audio.preload(this.doorSound);
        }        
    }

     /** Called when a message is received */
     async onMessage(msg) {
        // Check if it's a claiming message
        if (msg.action === 'found') {
            // Show it            
            if (!this.hasPickedUp) {
                this.hasPickedUp = true;
                this.plugin.objects.update(msg.obj, { hidden: true }, true);
                this.showToastMessage(msg.usrName,msg.objName);
                // Remove coin from server
                await this.performServerAction('remove-object');
            }   
        }
    }

    showToastMessage(usrName, objName){
        this.playSound();
        const toastID = this.plugin.menus.toast({
            icon: this.paths.absolute('./congrats.png'),
            text: usrName + ' has collected the ' + objName + '!',
            textColor: '#2DCA8C',      
            duration: 6000
        });
    }

    /** Called when an action is performed */
    onAction(action) {
        // Remove this collectable
        if (action == 'remove-object') {
            this.plugin.objects.remove(this.objectID)
        }
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
            return;
        }
       
        // Send message when object is found
        this.sendMessage({ action: 'found', obj: this.objectID, objName: this.objectName, objKey: this.objectKey, usr: this.userId, usrName: this.userName },  true);
    }

    playSound(){     
        let volume = 0.2;
        if (this.sound) {
            this.plugin.audio.play(this.sound, { x: this.fields.x || 0, y: this.fields.y || 0, height: this.fields.height || 0, radius: 5 }, { volume: volume })
        }
    }
 }
