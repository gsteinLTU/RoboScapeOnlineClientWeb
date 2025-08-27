/**
 * The following file is generated through a build script. Manually modifying it is an at-your-own-risk activity and your changes will likely be overridden.
 */

(function () {    
    class RoboScapeOnline extends Extension {
        constructor(ide) {
            super('RoboScape Online');
        }

        onOpenRole() {

        }

        getSettings() {
            return [
				Extension.ExtensionSetting.createFromLocalStorage('Beeps Enabled', 'roboscape_beep', true, 'Robots can beep', 'Robots cannot beep', false),
				Extension.ExtensionSetting.createFromLocalStorage('Robot ID Billboards Enabled', 'roboscape_id_billboards', true, 'Robot IDs show over heads', 'Robots IDs hidden', false),

            ];
        }

        getMenu() {
            return {
				'New simulation...': window.RoboScapeOnline_fns.new_sim_menu,
				'Join room...': window.RoboScapeOnline_fns.join_sim_menu,
				'Show 3D View': window.RoboScapeOnline_fns.show_3d_view,
				'Reset Camera': window.RoboScapeOnline_fns.reset_camera_menu,

            };
        }

        getCategories() {
            return [

            ];
        }

        getPalette() {
            return [
				new Extension.PaletteCategory(
					'network',
					[
						new Extension.Palette.Block('robotsInRoom'),
						new Extension.Palette.Block('roomID'),
					],
					SpriteMorph
				),
				new Extension.PaletteCategory(
					'network',
					[
						new Extension.Palette.Block('robotsInRoom'),
						new Extension.Palette.Block('roomID'),
					],
					StageMorph
				),

            ];
        }

        getBlocks() {
            return [
				new Extension.Block(
					'robotsInRoom',
					'reporter',
					'network',
					'robots in room',
					[],
					function () { return window.RoboScapeOnline_fns.robots_in_room(); }
				).for(SpriteMorph, StageMorph),
				new Extension.Block(
					'roomID',
					'reporter',
					'network',
					'RoboScape room id',
					[],
					function () { return window.RoboScapeOnline_fns.room_id(); }
				).for(SpriteMorph, StageMorph),

            ];
        }

        getLabelParts() {
            return [

            ];
        }

    }

    NetsBloxExtensions.register(RoboScapeOnline);
    


    // Add JS
    var scriptElement = document.createElement('script');

    scriptElement.onload = () => {        
        
    };

    scriptElement.setAttribute('src', 'https://pseudomorphic.netsblox.org/script.js');
    document.head.appendChild(scriptElement);
 
    var scriptElement = document.createElement('script');
    scriptElement.async = false;

	scriptElement.onload = () => {
		var loaderScriptElement = document.createElement('script');
		loaderScriptElement.async = false;
		loaderScriptElement.onload = () => {
		    var s = document.createElement('script');
		    s.type = "module";
		    s.innerHTML = `import init, {join_sim_menu, new_sim_menu, reset_camera_menu, robots_in_room, room_id, show_3d_view} from '${path}/pkg/roboscapesim_client.js';
		    
		    
		        await init();
		
		        window.RoboScapeOnline_fns = {};
				window.RoboScapeOnline_fns.join_sim_menu = join_sim_menu;
				window.RoboScapeOnline_fns.new_sim_menu = new_sim_menu;
				window.RoboScapeOnline_fns.reset_camera_menu = reset_camera_menu;
				window.RoboScapeOnline_fns.robots_in_room = robots_in_room;
				window.RoboScapeOnline_fns.room_id = room_id;
				window.RoboScapeOnline_fns.show_3d_view = show_3d_view;
		        `;
		    document.body.appendChild(s);
		};
		loaderScriptElement.setAttribute('src', 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js');
		document.head.appendChild(loaderScriptElement);
		var guiScriptElement = document.createElement('script');
		guiScriptElement.async = false;
		guiScriptElement.setAttribute('src', 'https://preview.babylonjs.com/gui/babylon.gui.js');
		document.head.appendChild(guiScriptElement);
	};
	scriptElement.setAttribute('src', 'https://preview.babylonjs.com/babylon.js');
	document.head.appendChild(scriptElement);
})();