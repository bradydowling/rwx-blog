import React from 'react'
import moment from 'moment'
import './style.scss'

class YoutubeVid extends React.Component {
  render() {
    const {
      title,
      publishedAt,
      description,
      videoId,
    } = this.props.data.node
    const videoLink = `https://youtube.com/v/${videoId}`
    const date = new Date(publishedAt)
    const category = 'Video'
    const categorySlug = 'https://youtube.com/c/ReadWriteExercise'

    return (
      <div className="vid">
        <div className="vid__meta">
          <time
            className="vid__meta-time"
            dateTime={moment(date).format('MMMM D, YYYY')}
          >
            {moment(date).format('MMMM YYYY')}
          </time>
          <span className="vid__meta-divider" />
          <span className="vid__meta-category" key={categorySlug}>
            <a href={categorySlug} target="_blank" rel="noopener noreferrer" className="vid__meta-category-link">
              {category}
            </a>
          </span>
        </div>
        <h2 className="vid__title">
          <a className="vid__title-link" target="_blank" rel="noopener noreferrer" href={videoLink}>
            {title}
          </a>
        </h2>
        <p className="vid__description">{description.split('\n')[0]}</p>
        <iframe title={title} width="560" height="315" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen />
      </div>
    )
  }
}

export default YoutubeVid
