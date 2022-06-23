/**
 * Send Message to users
 *
 * Displays information from admin to everyone in the space.
 *
 * @author gersonxicon
 */
 module.exports = class fireworksTest extends BasePlugin {

    /** Plugin info */
    static get id()             { return 'EYFoundry.overlay-fireworks' }
    static get name()           { return 'Overlay Fireworks' }
    static get description()    { return 'Displays fireworks to users in the space.' }

    fireworks = false;
    
    /** Called on load event */
    async onLoad() {
		
        // Register close panel button
		const firePnl = await this.menus.register({
            id: 'EYFoundry.start-fireworks',
            title: 'Fireworks',
			text: 'Fireworks',
            section: 'controls',
            adminOnly: true,
			currentUser: true,
            icon: this.paths.absolute('./firework.png'),
            action: e => this.sendMessageFireworks(e)
        });   
    }

    sendMessageFireworks(e){
        this.messages.send({ action: 'start-fireworks' }, true);
    }

    onMessage(msg) {	
        // Check message type
        if (msg.action === 'start-fireworks')
		{
            this.startFireworks(msg);
		}
    }

    async startFireworks(msg)
    {
        if(!this.fireworks)
        {
            this.fireworks = true;
            this.playSound();

            // Register iframe in info panel
            this.menus.register({
                id: 'EYFoundry.overlay-fireworks',
                section: 'overlay-top',
                    panel: {
                        iframeURL: this.paths.absolute('./index.html'),
                        width: 150,
                        height: 100
                    }
                });            
            await new Promise(r => setTimeout(r, 5000));        
            this.menus.unregister('EYFoundry.overlay-fireworks');  
            this.fireworks = false;
        }
    }

    playSound(){
		const sound = this.paths.absolute('./fireworks.mp3');

		let volume = 0.2; 
		if (sound) {
			this.audio.play(sound, { volume: volume })
		}
 	}
}
	
    

