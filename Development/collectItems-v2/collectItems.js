/**
 * 
 *
 * Allows to mark objects as collectable and coordinate between users what have been collected.
 *
 * @author gersonxicon
 */
/** List of active objects */
let activeCollectable = [];
let collectedItems = [];
let posBefore = 0;
let posAfter = -20;
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
			
        // Allow message to be configured
        this.menus.register({
            id: 'EYFoundry.collectable-overlay',
            section: 'plugin-settings',
            panel: {
                fields: [
                    { type: 'text', id: 'img1', name: 'Image 1', help: 'Set image 1 for item in overlay panel.' },
                    { type: 'text', id: 'img2', name: 'Image 2', help: 'Set image 2 for item in overlay panel.' },
                    { type: 'text', id: 'img3', name: 'Image 3', help: 'Set image 3 for item in overlay panel.' },
                    { type: 'text', id: 'silImg', name: 'Placeholder image', help: 'Set silhouette image for item in overlay panel.' },
                    { type: 'text', id: 'background', name: 'Overlay background', help: 'Set background image for overlay panel.' },
                    { type: 'text', id: 'yObjectsBeforeLocation', name: 'Y Original Location', help: 'Set collectables Y original location.' },
                    { type: 'text', id: 'yObjectsAfterLocation', name: 'Y Location to move', help: 'Set collectables Y location to move after collected.' }

                ]
            }
        });

        posBefore = this.getField('yObjectsBeforeLocation') || 0;
        posAfter = this.getField('yObjectsAfterLocation') || -20;

        // Register Object component
        this.objects.registerComponent(Obj, {
            id: 'EyFoundry.collectable-object',
            name: 'Mark object as collectable',
            description: 'Convert object to collectable item for the inventory.',
            settings: [
                { type: 'text', id: 'activationDistance', name: 'Activation Distance', help: 'Set activation distance for object interaction (integer).' },
                { type: 'text', id: 'objectName', name: 'Object Name', help: 'Set object name for this collectable item.' },
                { type: 'text', id: 'objectKey', name: 'Object Index', help: 'Set object index for this collectable item.' }                
            ]
            });		

        // Register reset collect button
		const resetBtn = await this.menus.register({
            id: 'EYFoundry.reset-collectitems',
            title: 'Reset collect',
			text: 'Reset collect',
            section: 'admin-panel',
            adminOnly: true,
			currentUser: true,
            icon: this.paths.absolute('./reset.png'),
            action: e => this.onResetCollect(e)
        });

         // Register check button
		/*const check = await this.menus.register({
            id: 'EYFoundry.check-collection',
            title: 'Check',
			text: 'Check',
            section: 'controls',
            adminOnly: false,
			currentUser: true,
            icon: this.paths.absolute('./reset.png'),
            action: e => this.onCheckCollection(e)
        }); */  

        // Stop here if on the server
        if (this.isServer) {
            return;
        }

        //await new Promise(r => setTimeout(r, 5000));
        this.registerOverlayPanel();

        if(this.removeDuplicates(collectedItems).length < 1){
            this.messages.send({ action: 'get-collected', user: this.userId }, true);
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

    /** Called when the user presses the Send Info button from Admin menu */
    /*async onCheckCollection(e) {
        console.log('collected');
        console.log(collectedItems);
        console.log(activeCollectable);
    }*/

    /** Called when the user presses the Send Info button from Admin menu */
    async onResetCollect(e) {
        var collectableArray = this.getCollectableArray().length;
        if(collectableArray !== 3){
            collectableArray = 3;
        }
        //if(this.removeDuplicates(collectedItems).length >= collectableArray){
            this.messages.send({ action: 'reset' }, true);      
        /*}
        else{
            this.menus.alert('You must collect all the keys first.', 'Information', 'info');
        }*/
    }

    getCollectableArray(){
        var arrayCollectable = [];
        for (let activeObj of activeCollectable){  
             arrayCollectable.push(activeObj.objectKey);        
        }   
        return this.removeDuplicates(arrayCollectable);
    }

    removeDuplicates(obj){
        return obj.filter((v, i, a) => a.indexOf(v) === i); 
    }

    async resetObjects(){
        collectedItems = [];        
        let activeCollectableAux = activeCollectable;
        //activeCollectable = [];
        for (let activeObj of activeCollectableAux) { 
            this.objects.update(activeObj.objectID, { hidden: false, collide: false,
                position: [ activeObj.fields.x, posBefore, activeObj.fields.y ]
                /*, disabled: false*/ }, false);             
        }       
        await this.hooks.trigger('opengate.resetgate');    
    }

    /** Called when the plugin is unloaded */
    onUnload() {
        // Remove timer
        if (this.timer) {
            clearInterval(this.timer)
        }
    }	

    /** When an user receives the message */
    async onMessage(msg) {	
        // On iframe load
        if(msg.action === 'overlay-load'){
            //await new Promise(r => setTimeout(r, 5000));
			this.setAllCollectables(msg);
		}
        else if(msg.action === 'reset'){
            this.setAllCollectables(null);   
            this.resetObjects();
        }       
        else if(msg.action === 'get-collected'){
            if(this.userId !== msg.user){
                this.messages.send({ action: 'set-collected', user: msg.user, collected: collectedItems }, false, msg.user);
            }
        } 
        else if(msg.action === 'set-collected'){
            if(this.userId === msg.user){
                collectedItems = msg.collected;
                for(let item of collectedItems){
                    const index = parseInt(item) + 1;
                    const newIndex = 'img' + index;
                    const image = this.getField(newIndex);
                    // Show message in iframe
                    await this.menus.postMessage({ action: 'set-image', img: image, ind: item });
                }
            }
        }
    }

    /** When we receive a message, display it */
    async setAllCollectables(msg) {
        var images = [];
        var background = '';
        /*for (let activeObj of activeCollectable) {
            var valueToPush = {};
            valueToPush.img = activeObj.img;
            valueToPush.objKey = activeObj.objKey;
            valueToPush.silImg = activeObj.silImg;
            background = activeObj.back;
            images.push(valueToPush);
        }*/
        //Image1
        var valueToPush = {};
        valueToPush.img = this.getField('img1');
        valueToPush.objKey = 0;
        valueToPush.silImg = this.getField('silImg');
        background = this.getField('background');
        images.push(valueToPush);
        //Image2
        valueToPush = {};
        valueToPush.img = this.getField('img2');
        valueToPush.objKey = 1;
        valueToPush.silImg = this.getField('silImg');
        background = this.getField('background');
        images.push(valueToPush);
        //Image3
        valueToPush = {};
        valueToPush.img = this.getField('img3');
        valueToPush.objKey = 2;
        valueToPush.silImg = this.getField('silImg');
        background = this.getField('background');
        images.push(valueToPush);

		// Show message in iframe
        await this.menus.postMessage({ action: 'set-collectables', imgs: images, back: background });
    }

    /** Called on a regular interval */
    async onTimer() {
        // Get position of user
        const userPos = await this.user.getPosition()

        // Run each timer
        for(let activeObj of activeCollectable){
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
    doorSound = this.paths.absolute('./treasure.mp3');
    completedSound = this.paths.absolute('./completed.mp3');
    objectName = '';
    objectKey = '';
    img = '';
    silImg = '';
    back = '';

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
        this.back = this.getField('background')
        // Store it
        activeCollectable.push(this);

        if (this.doorSound) {
            this.plugin.audio.preload(this.doorSound);
        }   
        
        if (this.completedSound) {
            this.plugin.audio.preload(this.completedSound);
        }   
    }

     /** Called when a message is received */
     async onMessage(msg) {
        // Check if it's a claiming message
        if (msg.action === 'found') {     
            if (!this.fields.collide) {                
                this.fields.collide = true;
                this.plugin.objects.update(this.objectID, { hidden: true, collide: true,
                    position: [ msg.posX, posAfter, msg.posZ ]
                    /*, disabled: true*/ }, false);         
                this.showToastMessage(msg.usrName,msg.objName,msg.objKey,msg.image);     
                collectedItems = this.removeDuplicates(msg.collected);  
            }
        }
    }

    removeDuplicates(obj){
        return obj.filter((v, i, a) => a.indexOf(v) === i); 
    }

    async showToastMessage(usrName, objName, objKey, image){
        
        this.playSound();
        const toastID = await this.plugin.menus.toast({
            icon: this.paths.absolute('./congrats.png'),
            text: usrName + ' has collected the ' + objName + '!',
            textColor: '#2DCA8C',      
            duration: 8000
        });
        this.setImageOverlay(objKey,image);
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

        // Only allow pickup once
        if (this.fields.hidden) {
            return
        }

        this.fields.hidden = true;

        if(!collectedItems.includes(this.objectKey)){
            collectedItems.push(this.objectKey);
        }
        // Send message when object is found
        this.sendMessage({ action: 'found', obj: this.objectID, objName: this.objectName, objKey: this.objectKey, usr: this.userId, usrName: this.userName, image: this.img, collected: collectedItems, posX: x, posY: y, posZ: z },  true);            
    }

    setImageOverlay(objKey,image) {
        // Show message in iframe
        this.plugin.menus.postMessage({ action: 'set-image', img: image, ind: objKey });
        
        var collectableArray = this.getCollectableArray().length;
        if(collectableArray !== 3){
            collectableArray = 3;
        }
        if(this.removeDuplicates(collectedItems).length >= collectableArray){
            this.showCompleted();
        }
    }

    getCollectableArray(){
        var arrayCollectable = [];
        for (let activeObj of activeCollectable) {  
             arrayCollectable.push(activeObj.objectKey);        
        }   
        return this.removeDuplicates(arrayCollectable);
    }

    async showCompleted()
    {
        if(!this.completed){
            this.completed = true;
            this.playCompletedSound();

            // Register iframe in info panel
            this.plugin.menus.register({
                id: 'EYFoundry.overlay-completed',
                section: 'overlay-top',
                    panel: {
                        iframeURL: this.paths.absolute('./completed.html'),
                        width: 150,
                        height: 100
                    }
                });            
            await this.plugin.hooks.trigger('opengate.keyscollected');
            await new Promise(r => setTimeout(r, 12000));        
            this.plugin.menus.unregister('EYFoundry.overlay-completed');  
            this.completed = false;              
        }
    }

    playSound(){     
        let volume = 0.2;
        if (this.doorSound) {
            this.plugin.audio.play(this.doorSound, { x: this.fields.x || 0, y: this.fields.y || 0, height: this.fields.height || 0, radius: 5 }, { volume: volume })
        }
    }

    playCompletedSound(){
        let volume = 0.4;
        if (this.completedSound) {
            this.plugin.audio.play(this.completedSound, { volume: volume })
        }
    }
 }
