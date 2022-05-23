module.exports = class evanPlugOnEnterExitMessaging extends BasePlugin  {

    /** Plugin info */
    static get id()             { return 'EYFoundry-onEntryExitMessaging' }
    static get name()           { return 'EntryExitMessaging' }
    static get description()    { return 'Display custom messages to user on entry and exit of object' }

    /** Called when the plugin is loaded */
    onLoad() {

       console.log("ComponentCompEventMessaging Plug loaded - v0.5")
       
        // Register component
        this.objects.registerComponent(evanPlugVelocityBase, {
            id: 'EYFoundry-onEntryExitMessaging',
            name: 'EntryExitMessaging',
            description: "Display custom messages to user on entry and exit of object",
            settings: [
                { id: 'lbl-onEnter', type: 'label', value: "onEnter Message" },
                { id: 'txt-onEnter', type: 'text'},
                { id: 'lbl-onExit', type: 'label', value: "onExit Message" },
                { id: 'txt-onExit', type: 'text'}
              
            ]
        })

    }
}

class evanPlugVelocityBase extends BaseComponent {
   
    isPreviousInside = false
    isChecking = false
    instanceID = "string"

    onLoad(){
        console.log("Event Component Loaded 0..55v")

        //Generate instanceID
        this.instanceID = Math.random().toString(36).substring(2)

        this.timer = setInterval(this.checkIfWithin.bind(this), 1000)

     }

     onObjectUpdated(newFields)
     {

        console.log(newFields)
     }
  

    onUnload(){
          
            clearInterval(this.Timer)


    }



   async checkIfWithin(){
       if (this.isChecking){return}

       this.isChecking = true


         // Get user position
         let userPos = await this.plugin.user.getPosition()

         // Check if we are inside this object
         let minX = this.fields.world_center_x - this.fields.world_bounds_x/2
         let minY = this.fields.world_center_y - this.fields.world_bounds_y/2
         let minZ = this.fields.world_center_z - this.fields.world_bounds_z/2
         let maxX = this.fields.world_center_x + this.fields.world_bounds_x/2
         let maxY = this.fields.world_center_y + this.fields.world_bounds_y/2
         let maxZ = this.fields.world_center_z + this.fields.world_bounds_z/2
         let isNowInside = userPos.x >= minX && userPos.x <= maxX && userPos.y >= minY && userPos.y <= maxY && userPos.z >= minZ && userPos.z <= maxZ
        

    
         if (!this.isPreviousInside && isNowInside) //outside and now inside
         {
                //user has entered
                this.isPreviousInside = true


                //display toast
                this.plugin.menus.toast({     
                text: this.getField('txt-onEnter'),
                textColor: '#2DCA8C',
                duration: 4000})

   

         }

         if( this.isPreviousInside && !isNowInside) //inside and now outside
         {
                //user has exited
                this.isPreviousInside = false

                         
                //display toast
                this.plugin.menus.toast({     
                    text: this.getField('txt-onExit'),
                    textColor: '#2DCA8C',
                    duration: 4000})


         }

         this.isChecking = false
           
    }
   
 
}



 

   

   
