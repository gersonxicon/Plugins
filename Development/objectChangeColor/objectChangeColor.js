/**
 * Allows to change object color on event
 *
 *
 * @author gersonxicon
 */
 module.exports = class changeColorEvent extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.change-color' }
    static get name()           { return 'Change Object Color' }
    static get description()    { return 'Change object color on click.' }

    /** Called on load event */
    async onLoad() {
	    // Register coin component
        this.objects.registerComponent(Obj, {
        id: 'EyFoundry.ChangeColorObject',
        name: 'Change Color',
        description: 'Change color of object when clicked.'
        });		
    }	
}


/**
 * Component that allows an object to be a coin.
 */
 class Obj extends BaseComponent {

    /** Called when the component is loaded */
    onLoad() {
        // Generate instance ID
        this.instanceID = Math.random().toString(36).substr(2);

    }

    /** Called when the object is clicked */
    onClick() {
        let random = '#' + this.randomColor();
        this.plugin.objects.update(this.objectID, { color: random }, true);
    }

    randomColor(){
        return Math.floor(Math.random()*16777215).toString(16);
    }
 }
