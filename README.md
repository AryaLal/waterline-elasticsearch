![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)

# ElasticSearch

Waterline adapter for ElasticSearch.

This is a rough implementation, so PRs are welcome. We're using it on several of
our projects, and we'll be making fixes and updates as needed, but raising
issues will help us harden this implementation.

## Installation

Install from NPM.

```bash
$ npm install waterline-es --save
```

## Waterline Configuration

Add the elasticSearch config to the `config/adapters.js` file.

### Using with Waterline v0.10.x

```javascript
import waterline from 'waterline';
import elasticSearchAdapter from 'waterline-es';

var config = {
  adapters: {
    elasticsearch: elasticSearchAdapter
  },
  connections: {
    elasticSearch: {
      adapter: 'elasticsearch',
      connectionParams: {
        loginUrl: 'https://localhost:9200'
      }
    }
  }
};

waterline.initialize(config, function (err, ontology) {

});
```
