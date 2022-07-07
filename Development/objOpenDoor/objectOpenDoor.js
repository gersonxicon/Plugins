/**
 * Allows to convert an object to a plate to open a door
 *
 *
 * @author gersonxicon
 */
/** List of NPC objects */
let activeObjects = [];
let activeUsers = [];

 module.exports = class objOpenDoor extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.object-opendoor' }
    static get name()           { return 'Allows to push a plate in order to open a door.' }
    static get description()    { return 'Convert an object to a plate to open a door.' }

    /** Timer used to check for updates */
    timer = null;

    /** Called on load event */
    async onLoad() {
	    // Register Object component
        this.objects.registerComponent(Obj, {
        id: 'EyFoundry.ObjOpenDoor',
        name: 'Create a plate from object.',
        description: 'Convert this object to a plate to open the door.',
        settings: [
            { type: 'text', id: 'activationDistance', name: 'Activation Distance', help: 'Set activation distance for object interaction (integer).' },
            { type: 'text', id: 'usersPlate', name: 'Amount of users for plate', help: 'Set amount of users for plate in order to push it (integer).' }

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
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/es6-tween/5.5.11/Tween.min.js');
        TWEEN.autoPlay(true);

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
                // Store it
                let index = this.getIndex(msg.usr);
                if(index < 0){ 
                    //Adding new row to the array  
                    var valueToPush = {};
                    valueToPush.usr = msg.usr;
                    valueToPush.obj = msg.obj;
                    valueToPush.activated = false;
                    activeUsers.push(valueToPush);   
                    //Get users on this object
                    const res = this.getUsersOnObject();
                    if(res.length === parseInt(this.getField('usersPlate')) && !this.checkActivatedObj())
                    {        
                        this.moveObject('plate',0,-0.1,0);    
                        //Update all existing rows for current object
                        this.updateActivatedObj(true);                        
                    }                           
                }                  
        }   
        else if(msg.action === 'hide'){             
            //Get users on this object
            const res = this.getUsersOnObject();     
            if(res.length > 0){     
                const activeUsers = this.getActiveUsersOnObject();
                if(activeUsers === parseInt(this.getField('usersPlate') - 1)){
                    //Returning to original position
                    this.moveObject('plate',0,0.1,0);   
                    this.updateActivatedObj(false);  
                }
                this.removeUser(msg);
            } 
        }     
    }
  
    getIndex(search) {
        return activeUsers.map(function(o) { return o.usr; }).indexOf(search);
    }

    removeUser(msg){      
        var index = this.getIndex(msg.usr);  
        if (index >= 0) {
            activeUsers.splice( index, 1 );
        }        
    }

    getUsersOnObject(){
        const res = activeUsers.filter((object) => {
            return object.obj === this.objectID;
        }) 
        return res;
    }

    getActiveUsersOnObject(){
        var intUsers = 0;
        for (var i = 0, l = activeUsers.length; i < l; i++) {
            if (activeUsers[i].obj === this.objectID) {
                if (activeUsers[i].activated) {
                    intUsers++;
                }                
            }
        } 
        return intUsers;
    }

    updateActivatedObj(value){
        for (var i = 0, l = activeUsers.length; i < l; i++) {
            if (activeUsers[i].obj === this.objectID) {
                activeUsers[i].activated = value;
                break;
            }
        } 
    }

    checkActivatedObj(){
        var bolActivated = false;
        for (var i = 0, l = activeUsers.length; i < l; i++) {
            if (activeUsers[i].obj === this.objectID) {
                if (activeUsers[i].activated) {
                    bolActivated = true;
                    break;
                }                
            }
        } 
        return bolActivated;
    }
    
    async moveObject(type, setX,setY,setZ){
        // Get object position
        const x = this.fields.x       || 0
        const y = this.fields.height  || 0
        const z = this.fields.y       || 0

       try {		
            if(type === 'plate')
            {
                let newX = x + setX;
                let newY = y + setY;
                let newZ = z + setZ;	
                
                //Setting object position
                this.setObjectPosition(x,y,z,newX,newY,newZ);                            
            }
       }
       catch (e) {}		
   }

   setObjectPosition(prevX,prevY,prevZ,setX,setY,setZ){       
           var _self = this;
           //Funciona desde aca***
           let coords = { x: prevX, y: prevY, z: prevZ };
           let target = { x: setX, y: setY, z: setZ };

           let tween = new TWEEN.Tween(coords)
           .to(target, 2000)
           .easing(TWEEN.Easing.Exponential.InOut)
           .repeat(1)
           .on('update', function (obj) {
               _self.plugin.objects.update(
                   _self.objectID,
                   {
                       position: [ obj.x, obj.y, obj.z ]                    
                   },
                   false);	
           })
           .start();
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
            this.sendMessage({ action: 'hide', obj: this.objectID, usr: this.userId },  true);
            return;
        }
       
        // Send message when object is found
        this.sendMessage({ action: 'found', obj: this.objectID, usr: this.userId },  true);
    }

    playSound(){
        const sound = this.paths.absolute('./treasure.mp3');
     
        let volume = 0.2;
        if (sound) {
            this.plugin.audio.play(sound, { volume: volume })
        }
    }
 }
