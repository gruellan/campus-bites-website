<template>
  <div id="contact">
    <v-layout id="layoutwrap" align-center fill-height row wrap>
      <v-flex xs12 md6 class="pa-3">
        <h2>{{title}}</h2>
        <hr />
        <p>
          We'd love to hear from you or respond to any questions you may have!
          <br />Email us with any inquiries at
          <a style="color:white" href="mailto:admin@campusbites.co.uk">admin@campusbites.co.uk</a>.
        </p>
        <br />
        <p>
          Alternatively, message us on our Facebook page!
          <a
            target="_blank"
            href="https://www.facebook.com/campusbitesUK/"
          >
            <v-icon id="messenger">fab fa-facebook-messenger</v-icon>
          </a>
        </p>
      </v-flex>
      <v-flex xs12 md6 class="pa-3">
        <img src="/photos/app/chat.svg" />
      </v-flex>
    </v-layout>
  </div>
</template>


<script>
export default {
  name: "Cookies",
  data: () => ({
    title: "Contact us!"
  })
};
</script>

<style lang="scss">
#contact {
  background-color: #ff6d1d;
  height: 100%;
  color: white;
  margin-top: 0px;

  #layoutwrap {
    margin-left: 5%;
  }

  h2 {
    font-weight: 600;
    font-size: 5em;
    padding: 10px 0px 10px 0px;
  }

  p {
    padding-top: 5px;
    font-size: 18px;
  }

  hr {
    width: 60%;
    border: 3px solid #ff8f53;
  }

  img {
    width: 60%;
    filter: invert(100%);
  }

  #messenger {
    font-size: 30px;
    padding-left: 1%;
    color: white;
    transition: all 0.2s ease-in-out;
  }

  #messenger:hover {
    color: #ff8f53;
    transform: scale(1.1);
  }
}
</style>
