#include "sciter-x.h"
#include "sciter-x-window.hpp"
#if defined(WIN32)
#include "sciter-win-main.cpp"
#else
#include "sciter-gtk-main.cpp"
#endif
#include <elzip.hpp>
class frame: public sciter::window {
public:
  frame() : window(SW_TITLEBAR | SW_RESIZEABLE | SW_CONTROLS | SW_MAIN | SW_ENABLE_DEBUG) {}

  SOM_PASSPORT_BEGIN(frame)
    SOM_FUNCS(
      SOM_FUNC(extractUpdate),
      SOM_FUNC(getFirstArg)
    )
  SOM_PASSPORT_END

  void extractUpdate() {
    elz::extractZip("eve.zip", "game/");
    call_function("extractionFinished");
  }

  sciter::string getFirstArg() {
    // not sure how to compare a sciter::string atm so will just return the first argument
    if(sciter::application::argv().size() > 1)
      return sciter::application::argv()[1];
    else
      return sciter::string();
  }

};

#include "resources.cpp" // resources packaged into binary blob.

int uimain(std::function<int()> run ) {
  // SciterSetOption(NULL, SCITER_SET_DEBUG_MODE, TRUE);
  SciterSetOption(NULL, SCITER_SET_SCRIPT_RUNTIME_FEATURES,
                          ALLOW_FILE_IO |
                          ALLOW_SOCKET_IO |
                          ALLOW_EVAL |
                          ALLOW_SYSINFO );
  sciter::archive::instance().open(aux::elements_of(resources)); // bind resources[] (defined in "resources.cpp") with the archive

  sciter::om::hasset<frame> pwin = new frame();

  // note: this:://app URL is dedicated to the sciter::archive content associated with the application
  pwin->load( WSTR("this://app/main.htm") );
  //or use this to load UI from
  //  pwin->load( WSTR("file:///home/andrew/Desktop/Project/res/main.htm") );

  pwin->expand();

  return run();
}
