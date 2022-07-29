/**
 * Allows objects to transport user based on proximity
 *
 *
 * @author gersonxicon
 */
/** List of active objects */
let activeObjects = [];
let objectID = '';
let completed = false;

 module.exports = class openGate extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.open-gate' }
    static get name()           { return 'Shows final popups and opens the gate.' }
    static get description()    { return 'Shows final popups and opens the gate for each user.' }

    /** Timer used to check for updates */
    timer = null;    

    /** Called on load event */
    async onLoad() {
	    // Register Object component
        this.objects.registerComponent(Obj, {
            id: 'EyFoundry.OpenGateFinal',
            name: 'Mark object as the final gate',
            description: 'Mark Object as a gate.',
            settings: [
                { type: 'text', id: 'xDoor', name: 'X Location', help: 'Set X location to transport.' },
                { type: 'text', id: 'yDoor', name: 'Y Location', help: 'Set Y location to transport.' },
                { type: 'text', id: 'zDoor', name: 'Z Location', help: 'Set Z location to transport.' },
                { type: 'text', id: 'activationDistance', name: 'Activation Distance', help: 'Set activation distance for object interaction (integer).' },
                //Mark for tweening
                { type: 'checkbox', id: 'padlock', name: 'Mark as padlock', help: 'Mark this object as a padlock.' }
            ]
        });		

        // Stop here if on the server
        if (this.isServer) {
            return;
        }

        this.hooks.addHandler('opengate.keyscollected', this.keysCollected);
        this.hooks.addHandler('opengate.resetgate', this.resetGate);

        // Start a distance check timer
        this.timer = setInterval(this.onTimer.bind(this), 200);
    }	

    /** Called when the user presses the Send Info button from Admin menu */
    async onResetGate() {
        this.messages.send({ action: 'reset' }, true);        
    }

    keysCollected(){
        completed = true;
    }

    resetGate = data => {
        completed = false;
        this.onResetGate();
    }
    
    /** Called when the plugin is unloaded */
    onUnload() {
        // Remove timer
        if (this.timer) {
            clearInterval(this.timer);
        }
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
        // On iframe load
        if(msg.action === 'overlay-load'){
            this.setMessage(objectID);
		}
        else if(msg.action === 'ok'){
            objectID = msg.obj;
            this.transport();			
		}
        else if(msg.action === 'reset'){
            this.resetObjects();
        }       
    }

    async resetObjects(){
        for (let activeObj of activeObjects) {  
            this.objects.update(
                activeObj.objectID,
                {
                    position: [ activeObj.posX, activeObj.posY * -1, activeObj.posZ ],
                    hidden: false, disabled: false, hasPickedUp: false
                },
            false);	
            activeObj.resetHasPickedUp();
        }       
    }
    /*
    setMessage(object){
        this.menus.postMessage({ action: 'update-message', msg: 'test', obj: object },true);
    }*/

}




/**
 * Component that allows an object to be interactive.
 */
 class Obj extends BaseComponent {
    
    userId = '';
    sound = this.paths.absolute('./door.mp3');
    posX = 0;
    posY = 0;
    posZ = 0;
    hasPickedUp = false;

    /** Called when the component is loaded */
    async onLoad() {
        this.userId = await this.plugin.user.getID();
        // Generate instance ID
        this.instanceID = Math.random().toString(36).substr(2);

        this.posX = this.getField('xDoor');
        this.posY = this.getField('yDoor');
        this.posZ = this.getField('zDoor');

        importScripts('https://cdnjs.cloudflare.com/ajax/libs/es6-tween/5.5.11/Tween.min.js');
        TWEEN.autoPlay(true);
        
        // Store it
        activeObjects.push(this);

        if (this.sound) {
            this.plugin.audio.preload(this.sound)
        }        
    }

    resetHasPickedUp(){
        this.hasPickedUp = false;
        completed = false;
    }

     /** Called when a message is received */
     async onMessage(msg) {
        // Check if it's a claiming message
        if (msg.action === 'found') {
            if(completed){
                // Show it            
                if (!this.hasPickedUp) {
                    if(!this.getField('padlock')){            
                        this.playSound();
                    }
                    this.moveObject(this);
                }
                //await new Promise(r => setTimeout(r, 3000));
                //this.plugin.objects.update(this.objectID, { hidden: true, disabled: true }, true);
                this.hasPickedUp = true;
            }
        }        
    }
    
    async moveObject(obj){
        // Get object position
        var x = 0;
        var y = 0;
        var z = 0;
        
        x = obj.fields.x       || 0
        y = obj.fields.height  || 0
        z = obj.fields.y       || 0
    

       try {
            var newX = 0;
            var newY = 0;
            var newZ = 0;
            
            newX = parseFloat(this.getField('xDoor'));
            newY = parseFloat(this.getField('yDoor'));
            newZ = parseFloat(this.getField('zDoor'));	
            //Setting object position
            this.setObjectPosition(x,y,z,newX,newY,newZ,obj.objectID);  
            
       }
       catch (e) {}		
   }

   setObjectPosition(prevX,prevY,prevZ,setX,setY,setZ,objectID){       
    var _self = this;
    //Funciona desde aca***
    let coords = { x: prevX, y: prevY, z: prevZ };
    let target = { x: setX, y: setY, z: setZ };

    if(!this.getField('padlock')){
        let tween = new TWEEN.Tween(coords)
        .to(target, 1800)
        .easing(TWEEN.Easing.Linear)
        .repeat(1)
        .on('update', function (obj) {
            _self.plugin.objects.update(
                objectID,
                {
                    position: [ obj.x, obj.y, obj.z ]                    
                },
                true);	
        })
        .start();
    }
    else{
        this.plugin.objects.update(
            objectID,
            {
                position: [ setX,setY,setZ ]                    
            },
            true);	
    }
    }

     /** Called on a regular basis to check if user can see the object */
     onTimer(userPos) {

        const x = this.fields.x       || 0
        const y = this.fields.height  || 0
        const z = this.fields.y       || 0

        // Calculate distance between the user and object
        const distance = Math.sqrt((x - userPos.x) ** 2 + (y - userPos.y) ** 2 + (z - userPos.z) ** 2)

        const parameterDistance = (this.getField('activationDistance') === undefined) ? 1 : parseInt(this.getField('activationDistance'));
        // Stop if far away
        if (distance > parameterDistance) {
            this.sendMessage({ action: 'hide' },  false, this.userId);
            this.available = false;      
            return;
        }

        this.available = true;       
        // Send message when object is found
        this.sendMessage({ action: 'found' },  false, this.userId);
    }

    playSound(){     
        let volume = 0.2;
        if (this.sound) {
            this.plugin.audio.play(this.sound, { volume: volume })
        }
    }
 }
