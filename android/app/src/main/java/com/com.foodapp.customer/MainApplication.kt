package com.foodapp.customer

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.core.ImagePipelineConfig
import com.facebook.imagepipeline.core.ImageTranscoderType
import com.facebook.imagepipeline.core.MemoryChunkType

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()

    // Pre-initialize Fresco with pure Java implementations to avoid needing
    // native .so files (libimagepipeline.so, libnative-imagetranscoder.so,
    // libnative-filters.so) which the RN Gradle plugin doesn't package.
    if (!Fresco.hasBeenInitialized()) {
      val builder = ImagePipelineConfig.newBuilder(this)
        .setMemoryChunkType(MemoryChunkType.BUFFER_MEMORY)
        .setImageTranscoderType(ImageTranscoderType.JAVA_TRANSCODER)
      builder.experiment().setNativeCodeDisabled(true)
      Fresco.initialize(this, builder.build())
    }

    loadReactNative(this)
  }
}

