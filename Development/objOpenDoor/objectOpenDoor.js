/**
 * Allows to convert an object to a plate to open a door
 *
 *
 * @author gersonxicon
 */
/** List of NPC objects */
let activeObjects = [];
let activeUsers = [];
let activeDoors = [];

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
            { type: 'text', id: 'usersPlate', name: 'Amount of users for plate', help: 'Set amount of users for plate in order to push it (integer).' },
            { type: 'checkbox', id: 'door', name: 'Mark as door', help: 'Check this to mark this object as a door.' },
            { type: 'text', id: 'doorMovement', name: 'Door movement amount', help: 'Set door movement amount for each pushed plate (float).' }
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
            if(!activeObj.isDoor){
                activeObj.onTimer(userPos);
            }
        }
    }
}


/**
 * Component that allows an object to be interactive.
 */
 class Obj extends BaseComponent {
    userId = '';
    hasPickedUp = true;
    isDoor = false;
    doorMov = 0;
    doorMovCount = 0;
    doorMoved = false;

    /** Called when the component is loaded */
    async onLoad() {
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/es6-tween/5.5.11/Tween.min.js');
        TWEEN.autoPlay(true);

        this.userId = await this.plugin.user.getID()
        this.isDoor = (this.getField('door') === undefined) ? false : this.getField('door');
        this.doorMov = parseFloat((this.getField('doorMovement') === undefined) ? 0.1 : this.getField('doorMovement'));
        // Generate instance ID
        this.instanceID = Math.random().toString(36).substr(2);

        // Store it
        activeObjects.push(this);

        this.setActiveDoors();

        const sound = this.paths.absolute('./treasure.mp3');
        if (sound) {
            this.plugin.audio.preload(sound)
        }        
    }

     /** Called when a message is received */
     async onMessage(msg) {
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
                        const res = this.getUsersOnObject(msg.obj);
                        if(res.length === parseInt(this.getField('usersPlate')) && !this.checkActivatedObj(msg.obj))
                        {   
                            //Push plate     
                            this.moveObject('plate',0,-0.1,0,msg.obj); 

                            //Move doors
                            var doorObjects = this.getDoorObjects();
                            let activatedObjects = this.getActivatedPlates();
                            //if(activatedObjects < (this.getPlateObjects().length - 1)){
                                for (var i = 0, l = doorObjects.length; i < l; i++) {
                                    this.moveObject('door',0,-(this.doorMov),0,doorObjects[i]);                                
                                } 
                            //}
                            
                            //Update all existing rows for current object
                            this.updateActivatedObj(msg.obj,true);   
                            this.hasPickedUp = false;   
                        }                           
                    }                  
            }   
            else if(msg.action === 'hide'){    
                //if(msg.obj === this.objectID && msg.usr === this.userId){  
                if(!this.checkUserInOtherObj(msg.obj,msg.usr)){
                    //Get users on this object
                    const res = this.getUsersOnObject(msg.obj);     
                    if(res.length > 0){   
                        const actUsers = this.getActiveUsersOnObject(msg.obj);
                        if(actUsers === parseInt(this.getField('usersPlate')) - 1 && this.checkActivatedObj(msg.obj)){                            
                            this.checkActivatedObj(msg.obj);
                            //Returning to original position
                            this.moveObject('plate',0,0.1,0,msg.obj);  
                            //Returning door
                            var doorObjects = this.getDoorObjects();                           
                            for (var i = 0, l = doorObjects.length; i < l; i++) {
                                this.moveObject('door',0,(this.doorMov),0,doorObjects[i]);
                            }                              

                            this.updateActivatedObj(msg.obj,false);  
                        }                                    
                        this.removeUser(msg);
                    } 
                    else{
                        if(parseInt(this.getField('usersPlate')) === 1 && !this.hasPickedUp){
                            //Returning to original position
                            this.moveObject('plate',0,0.1,0,msg.obj); 
                            //Returning door
                            var doorObjects = this.getDoorObjects();
                            for (var i = 0, l = doorObjects.length; i < l; i++) {
                                this.moveObject('door',0,(this.doorMov),0,doorObjects[i]);
                            }    

                            this.hasPickedUp = true;
                        }    
                    }
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

    getUsersOnObject(obj){
        const res = activeUsers.filter((object) => {
            return object.obj === obj;
        }) 
        return res;
    }

    getActiveUsersOnObject(obj){
        var intUsers = 0;
        for (var i = 0, l = activeUsers.length; i < l; i++) {
            if (activeUsers[i].obj === obj) {
                if (activeUsers[i].activated) {
                    intUsers++;
                }                
            }
        } 
        return intUsers;
    }

    updateActivatedObj(obj,value){
        for (var i = 0, l = activeUsers.length; i < l; i++) {
            if (activeUsers[i].obj === obj) {
                activeUsers[i].activated = value;
                break;
            }
        } 
    }

    checkActivatedObj(obj){
        var bolActivated = false;
        for (var i = 0, l = activeUsers.length; i < l; i++) {
            if (activeUsers[i].obj === obj) {
                if (activeUsers[i].activated) {
                    bolActivated = true;
                    break;
                }                
            }
        } 
        return bolActivated;
    }

    checkUserInOtherObj(obj,usr){
        var bolActivated = false;
        for (var i = 0, l = activeUsers.length; i < l; i++) {
            if (activeUsers[i].obj !== obj) {
                if(activeUsers[i].usr === usr)
                {
                    if (activeUsers[i].activated) {
                        bolActivated = true;
                        break;
                    }      
                }          
            }
        } 
        return bolActivated;
    }
    
    getDoorObjects(){
        let doors = [];
        for (var i = 0, l = activeObjects.length; i < l; i++) {
            if (activeObjects[i].isDoor) {                
                doors.push(activeObjects[i]);                        
            }
        } 
        return doors;
    }

    setActiveDoors(){
        activeDoors = [];
        for (var i = 0, l = activeObjects.length; i < l; i++) {
            if (activeObjects[i].isDoor) {                
                activeDoors.push(activeObjects[i]);                        
            }
        } 
    }

    getPlateObjects(){
        let plates = [];
        for (var i = 0, l = activeObjects.length; i < l; i++) {
            if (!activeObjects[i].isDoor) {                
                plates.push(activeObjects[i]);                        
            }
        } 
        return plates;
    }

    getActivatedPlates(){
        var intPlates = 0;
        for (var i = 0, l = activeUsers.length; i < l; i++) {
            if (activeUsers[i].activated) {
                intPlates++;
            }                            
        } 
        return intPlates;
    }

    async moveObject(type, setX,setY,setZ,obj){
        // Get object position
        var x = 0;
        var y = 0;
        var z = 0;

        if(type === 'plate'){
            x = this.fields.x       || 0
            y = this.fields.height  || 0
            z = this.fields.y       || 0
        }
        else if(type === 'door'){
            x = obj.fields.x       || 0
            y = obj.fields.height  || 0
            z = obj.fields.y       || 0
        }

       try {
            var newX = 0;
            var newY = 0;
            var newZ = 0;
            if(type === 'plate'){
                newX = x + setX;
                newY = y + setY;
                newZ = z + setZ;	
                //Setting object position
                this.setObjectPosition(x,y,z,newX,newY,newZ,obj);  
            }    
            else if(type === 'door'){
                newX = x + setX;
                newY = y + setY;
                newZ = z + setZ;	
                //Setting object position
                this.setObjectPosition(x,y,z,newX,newY,newZ,obj.objectID);  
            }
       }
       catch (e) {}		
   }

   setObjectPosition(prevX,prevY,prevZ,setX,setY,setZ,objectID){     
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
                   objectID,
                   {
                       position: [ obj.x, obj.y, obj.z ]                    
                   },
                   false);	
           })
           .start();
   }

     /** Called on a regular basis to check if user can see the object */
     async onTimer(userPos) {

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
