<template>
  <v-dialog v-model="visible" scrollable width="640" :fullscreen="$vuetify.breakpoint.xsOnly">
    <v-card v-if="dialog" id="extras-dialog">
      <v-card-title primary-title>
        <div>
          <h3 class="display-1 mb-0">{{ foodItem.name }}</h3>
          <div>{{ foodItem.description }}</div>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <template v-if="!loading">
          <div v-for="(section, index) in dialog" class="section" :key="index">
            <div class="body-2 mt-1">
              <template v-if="section.optional">
                <div style="float: left">
                  <h3 class="title">{{ section.title }}</h3>Optional
                  <span
                    v-if="section.description"
                    v-text="section.description"
                    class="body-1 mt-1"
                  />
                </div>
                <v-btn
                  v-if="getValue(section)"
                  flat
                  style="float: right"
                  outline
                  small
                  @click="clearSection(section)"
                >
                  Clear
                  <v-icon right>clear</v-icon>
                </v-btn>
              </template>
              <template v-else>
                <h3 class="title">{{ section.title }}</h3>
                <span v-if="section.description" v-text="section.description" class="body-1 mt-1" />
              </template>
            </div>
            <div style="clear: both" />

            <!-- radio section -->
            <v-radio-group
              v-if="section.radio"
              v-model="properties[section.property]"
              hide-details
              :mandatory="!section.optional"
            >
              <v-list class="list">
                <template v-for="item of section.radio">
                  <v-list-tile
                    avatar
                    :class="{ enabled: getValue(section) === item.name }"
                    :key="item.name"
                  >
                    <v-list-tile-avatar>
                      <v-radio :value="item.name" color="primary" />
                    </v-list-tile-avatar>

                    <div class="item">
                      {{ item.name }}
                      <span
                        v-if="getPriceChange(section, item)"
                        class="price"
                      >{{ getPriceChange(section, item) | price(true) }}</span>
                    </div>
                  </v-list-tile>

                  <!-- When values are chosen in a section it might enable
                  additional subsections where extra items can be chosen-->
                  <template v-for="subsection of item.subsections">
                    <!-- If a subsection has the select property..
                    for example, choosing drinks or sauces-->
                    <v-select
                      v-if="subsection.select"
                      v-model="properties[subsection.property]"
                      :items="subsection.select"
                      item-text="name"
                      item-value="name"
                      :disabled="properties[section.property] !== item.name"
                      :prepend-inner-icon="subsection.icon"
                      outline
                      hide-details
                      :label="subsection.title"
                      :key="subsection.property"
                    />
                  </template>
                </template>
              </v-list>
            </v-radio-group>

            <!-- Checkbox section -->
            <v-list v-if="section.checkboxes" class="list">
              <v-list-tile
                v-for="item of section.checkboxes"
                avatar
                :class="{ enabled: getValue(section, item) }"
                :key="item.name"
              >
                <v-list-tile-avatar>
                  <v-checkbox v-model="properties[section.property][item.name]" color="primary" />
                </v-list-tile-avatar>

                <div class="item">
                  {{ item.name }}
                  <span v-if="item.price" class="price">+{{ item.price | price }}</span>
                </div>
              </v-list-tile>
            </v-list>
          </div>
        </template>
        <div v-if="loading" style="width: 100%">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            style="display: block; margin: auto"
          />
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="mt-2">
        <v-btn large block outline color="primary" @click="cancel()">Cancel</v-btn>
        <v-btn
          large
          block
          color="primary"
          :disabled="!validate()"
          @click="addToBasket()"
        >Add for {{ getTotalPrice() | price }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "ExtrasDialog",
  data: () => ({
    visible: false,
    loading: true,
    dialog: undefined,
    foodItem: undefined,
    properties: {}
  }),
  computed: {
    ...mapGetters(["restaurantRef"])
  },
  methods: {
    openDialog(foodItem) {
      this.visible = true;

      let loading = false;

      const dialog = [];
      const deals = foodItem.deals || [];
      const properties = foodItem.properties || {};
      const order = foodItem.order || [];

      const _vm = this;

      if (deals.length > 0) {
        // Deals
        const dealsSection = {
          title: "Select a deal",
          property: "deals",
          optional: true,
          radio: deals.map(deal => {
            if (deal.properties) {
              return {
                name: deal.name,
                price: deal.price,
                subsections: Object.keys(deal.properties).map(property => {
                  const data = deal.properties[property];
                  data.property = property;

                  if (data.category) {
                    loading = true;
                    const docRef = this.restaurantRef
                      .collection("categories")
                      .doc(data.category.id);

                    // Get the food items for this category
                    this.restaurantRef
                      .collection("food-items")
                      .where("category", "==", docRef)
                      .get()
                      .then(snapshot => {
                        _vm.$set(
                          data,
                          "select",
                          snapshot.docs.map(doc => doc.data())
                        );
                        this.loading = false;
                      });
                  }

                  return data;
                })
              };
            }

            return deal;
          })
        };
        dialog.push(dealsSection);
      }

      dialog.push(
        ...Object.keys(properties).map(property => {
          const data = properties[property];
          const section = {
            title: data.title,
            description: data.description,
            property
          };

          if (data.options) {
            section.radio = data.options;
          } else if (data.items) {
            section.checkboxes = data.items;
          }

          return section;
        })
      );

      // Sort the sections into the correct order
      dialog.sort(
        (a, b) => order.indexOf(a.property) - order.indexOf(b.property)
      );

      this.dialog = dialog;
      this.foodItem = foodItem;
      this.properties = {};
      this.dialog.forEach(section => {
        if (section.checkboxes) {
          // Initialise the property map for checkbox sections
          // Use this.$set to make it reactive
          this.$set(this.properties, section.property, {});
        } else if (section.radio && !section.optional) {
          // Find the default for the section
          const defaultItem = section.radio.find(item => item.default);
          if (defaultItem) {
            // If there is a default set the value in the foodItem object
            // Use this.$set to make it reactive
            this.$set(this.properties, section.property, defaultItem.name);
          }
        }
      });
      this.loading = loading;
    },
    cancel() {
      this.visible = false;
      this.$emit("cancel");
    },
    addToBasket() {
      this.visible = false;

      // FIXME: work out why we need to parse/stringify to make this work
      const properties = JSON.parse(JSON.stringify(this.properties));
      const item = Object.assign({}, this.foodItem, {
        properties,
        price: this.getTotalPrice(),
        label: this.getExtrasLabel()
      });

      this.$emit("addToBasket", item);
    },
    getExtrasLabel() {
      const labelItems = [];
      this.dialog.forEach(section => {
        if (section.radio) {
          const value = this.getValue(section);
          if (!value) {
            return;
          }
          labelItems.push(value);

          const selectedItem = section.radio.find(item => item.name === value);
          if (selectedItem.subsections) {
            selectedItem.subsections.forEach(subsection => {
              const value = this.getValue(subsection);
              if (!value) {
                return;
              }

              labelItems.push(value);
            });
          }
        } else if (section.checkboxes) {
          section.checkboxes.forEach(item => {
            const value = this.getValue(section, item);
            if (value) {
              labelItems.push(item.name);
            }
          });
        }
      });
      return labelItems.join(", ");
    },
    getTotalPrice() {
      // TODO: rewrite with .reduce
      let total = 0;
      total += this.foodItem.price;
      this.dialog.forEach(section => {
        if (section.radio) {
          const value = this.getValue(section);
          if (!value) {
            return;
          }

          const selectedItem = section.radio.find(item => item.name === value);

          if (selectedItem) {
            // the item might not have a price
            total += selectedItem.price || 0;
          }
        } else if (section.checkboxes) {
          total += section.checkboxes
            .filter(item => this.getValue(section, item))
            .reduce((sum, item) => sum + item.price, 0);
        }
      });
      return total;
    },
    getPriceChange(section, item) {
      const selectedItem = section.radio.find(
        item => item.name === this.getValue(section)
      );

      if (!selectedItem) {
        return item.price;
      } else if (selectedItem === item) {
        return 0;
      }

      return item.price - selectedItem.price;
    },
    getRadioValue(section) {
      return this.properties[section.property];
    },
    getCheckboxValue(section, item) {
      const sectionData = this.properties[section.property];
      const itemData = sectionData ? sectionData[item.name] : undefined;

      return itemData;
    },
    getValue(section, item) {
      if (section.radio) {
        return this.getRadioValue(section);
      } else if (section.checkboxes) {
        return this.getCheckboxValue(section, item);
      } else if (section.select) {
        return this.properties[section.property];
      }
    },
    validate() {
      return !this.dialog.some(section => {
        // Checkboxes are not required, so return false.
        if (section.checkboxes) {
          return false;
        }

        const selectedItem = section.radio.find(
          item => item.name === this.getValue(section)
        );

        // If no value has been selected, return true.
        if (!selectedItem && !section.optional) {
          return true;
        } else if (!selectedItem && section.optional) {
          return false;
        }

        // If there are no subsections, return false.
        if (!selectedItem.subsections) {
          return false;
        }

        // If there is an incomplete subsection, return true.
        if (
          selectedItem.subsections.some(
            subsection => !subsection.optional && !this.getValue(subsection)
          )
        ) {
          return true;
        }

        // All tests passed, return false.
        return false;
      });
    },
    clearSection(section) {
      if (section.radio) {
        section.radio.forEach(item => {
          if (item.subsections) {
            // If there are any subsections for this section we need to
            //  clear their data too
            item.subsections.forEach(subsection => {
              this.properties[subsection.property] = undefined;
            });
          }
        });
      }
      this.properties[section.property] = undefined;
    }
  }
};
</script>

<style lang="scss">
#extras-dialog {
  padding: 16px 24px;

  .section {
    margin-top: 0;
    padding-top: 0;
    margin-bottom: 24px;

    .v-input {
      margin-top: 0;
    }
  }

  .section:last-of-type {
    margin-bottom: 0;
  }

  div[role="combobox"] {
    .v-input__slot {
      border: 2px solid rgba(0, 0, 0, 0.27);
      border-radius: 5px;
    }
  }

  .v-input--checkbox {
    .v-input__control {
      margin-top: 8px !important;
    }
  }

  .v-input__control {
    width: 100%;

    .v-input__slot {
      height: 48px;
      margin-bottom: 0;

      .v-input__icon--prepend-inner {
        margin-right: 32px;
      }

      .v-input__icon--append {
        margin-top: -15px;
        margin-right: 4px;
      }
    }
  }

  .v-select__slot {
    margin-top: 12px;

    .v-label {
      padding-top: 4px;
    }

    .v-select__selections {
      padding-top: 0;
    }
  }

  .list {
    div[role="listitem"] {
      border: 2px solid rgba(0, 0, 0, 0.27);
      border-radius: 5px;
      margin: 4px 0 8px;
    }

    div[role="listitem"].enabled {
      border-color: #ff6d1d;
    }

    .item {
      text-align: left;
      vertical-align: middle;
      width: 100%;

      .price {
        color: #676767;
        float: right;
      }
    }

    .v-list__tile--avatar {
      height: 48px;
    }
  }
}
</style>
