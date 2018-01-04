<template lang="html">
  <div class="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app',
  methods: {
    initWindowEvents () {
      if (!window) return
      window.onblur = function (e) {
        document.title = '您的浏览器崩溃啦/(ㄒoㄒ)/~~'
      }
      window.onfocus = function (e) {
        document.title = '欢迎回来~'
      }
    }
  },
  created () {
    this.initWindowEvents()
  }
}
</script>

<style lang="scss">
</style>
