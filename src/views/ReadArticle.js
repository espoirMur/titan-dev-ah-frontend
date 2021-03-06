/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-shadow */
import React, { Component } from "react";
import { connect } from "react-redux";
import Textarea from "react-textarea-autosize";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import Button from "../components/common/Buttons/BasicButton";
import { Comments } from "./Comments";
import { ReportingForm } from "../components/reportingForm/ReportingForm";
import RatingForm from "../components/common/RatingForm/RatingForm";
import {
  fetchArticle,
  deleteArticle
} from "../redux/actions/readArticleActionCreator";
import {
  fetchHighLights,
  markHighlightSection
} from "../redux/actions/highlightCommentActions";
import { reportedArticle } from "../redux/actions/reportArticleActions";
import { fetchRatings, rateArticle } from "../redux/actions/ratingActions";

import {
  inputHandleAsync,
  handleCommentsInputEdit,
  createComment,
  deleteComment,
  updateComment,
  fetchComments,
  likeAComment,
  setBodyEdit
} from "../redux/actions/commentActions";
import {
  isCurrentUserAuthor,
  stringToHtmlElement,
  calculateTimeStamp,
  isBottom,
  getSelectedLocation,
  markUserHighlight
} from "../utils/helperFunctions";
import MainArticle from "../components/common/Cards/main";
import { followUser } from "../redux/actions/followingActions";
import twitterIcon from "../assets/icons/twitter-icon.svg";
import facebookIcon from "../assets/icons/fb-icon.svg";
import thumbsUp from "../assets/img/like-icon.svg";
import authorImage from "../assets/img/author.svg";
import dislikeIcon from "../assets/img/dislike-icon.svg";
import moreIcon from "../assets/icons/more.svg";
import emailIcon from "../assets/img/paper-plane.svg";
import ShareIcon from "../components/common/Link/Social";
import Loading from "../components/Animations/LoadingDots";
import HighlighPopover from "../components/PopOvers/HighlighPopover";
import CommentModel from "../components/PopOvers/CommentModel";
import Bookmark from "./Bookmark";

export const mapStateToProps = ({
  auth,
  fetchedArticle,
  following,
  fetchedComments,
  user,
  highlights,
  rate
}) => ({
  currentUser: auth.currentUser,
  asideArticles: fetchedArticle.asideArticles,
  rate,
  article: fetchedArticle,
  following,
  commentBody: fetchedComments.body,
  updatedBody: fetchedComments.bodyEdit,
  success: fetchedComments.success,
  error: fetchedComments.error,
  comments: fetchedComments.comments,
  loading: fetchedComments.isLoading,
  profile: user.profile,
  highlights: highlights.articleHighlights
});

export const mapDispatchToProps = dispatch => ({
  deleteOneArticle: slug => dispatch(deleteArticle(slug)),
  fetchOneArticle: slug => dispatch(fetchArticle(slug)),
  followUser: (username, { location, history }) =>
    dispatch(followUser(username, { location, history })),
  reportArticle: (description, slug) =>
    dispatch(reportedArticle(description, slug)),
  onHandleCommentsInput: payload => dispatch(inputHandleAsync(payload)),
  onHandleCommentsInputEdit: payload =>
    dispatch(handleCommentsInputEdit(payload)),
  onCreateComments: (comment, slug) => dispatch(createComment(comment, slug)),
  onDeleteComment: (commentId, slug) =>
    dispatch(deleteComment(commentId, slug)),
  onUpdateComment: (body, slug) => dispatch(updateComment(body, slug)),
  onFetchComments: (commentId, slug) =>
    dispatch(fetchComments(commentId, slug)),
  onSetBodyEdit: payload => dispatch(setBodyEdit(payload)),
  onLikeComment: (commentId, slug) => dispatch(likeAComment(commentId, slug)),
  markHighlight: (articleBody, save = false) =>
    dispatch(markHighlightSection(articleBody, save)),
  fetchHighLights: slug => dispatch(fetchHighLights(slug)),
  fetchRatings: slug => dispatch(fetchRatings(slug)),
  rateArticle: (slug, rate) => dispatch(rateArticle(slug, rate))
});

export class Article extends Component {
  state = {
    slug: "",
    response: "",
    displayModal: false,
    reportingForm: false,
    page: 1,
    isCommentEmpty: true,
    top: 0,
    left: 0,
    highlightedText: "",
    commentModelOpen: false
  };

  componentDidMount = () => {
    const {
      fetchOneArticle,
      onFetchComments,
      fetchHighLights,
      match: {
        params: { slug }
      }
    } = this.props;

    this.setState({ slug });
    fetchOneArticle(slug);
    fetchHighLights(slug);
    document.addEventListener("mousedown", this.handleClickOutside);
    onFetchComments(slug, 1);
  };

  componentWillMount = () => {
    this.getMoreArticles();
    document.addEventListener("scroll", () => this.handleScroll(), true);
    document.addEventListener("select", this.handleHighlight);
  };

  componentWillReceiveProps = nextProps => {
    const {
      article: { article },
      fetchOneArticle
    } = this.props;
    if (article && nextProps.match.params.slug !== article.slug) {
      this.setState({ slug: nextProps.match.params.slug });
      fetchOneArticle(nextProps.match.params.slug);
    }
    return false;
  };

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
    document.removeEventListener("select", this.handleHighlight);
  }

  setArticleBodyRef = node => {
    this.articleBodyRef = node;
  };

  setWrapperRef = node => {
    this.wrapperRef = node;
  };

  getMoreArticles = () => {
    const { page } = this.state;
    const {
      onFetchComments,
      match: {
        params: { slug }
      }
    } = this.props;
    onFetchComments(slug, page);
  };

  handleHighlight = e => {
    const commentModelRef = document.getElementById("comment-model");
    const text = window.getSelection().toString();
    if (
      this.articleBodyRef &&
      this.articleBodyRef.contains(e.target) &&
      this.articleBodyRef.contains(window.getSelection().anchorNode) &&
      text
    ) {
      const { top, left } = getSelectedLocation();
      this.setState({
        top,
        left,
        highlightedText: text
      });
    } else if (commentModelRef && commentModelRef.contains(e.target)) {
      return this.state;
    } else {
      this.setState({
        top: 0,
        left: 0
      });
    }
  };

  markHighlightText = (save, withComment = "") => {
    const {
      markHighlight,
      article: {
        article: { body, slug }
      }
    } = this.props;
    const { highlightedText } = this.state;
    if (withComment) {
      this.setState({
        commentModelOpen: true
      });
    }
    markHighlight({
      body,
      slug,
      text: highlightedText,
      save
    });
  };

  handleClickOutside = event => {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.setState(() => ({ displayModal: false }));
    }
  };

  toggleReactionsModal = () => {
    const { displayModal } = this.state;
    if (displayModal === true) {
      return this.setState({ displayModal: false });
    }
    return this.setState({ displayModal: true });
  };

  toggleReportingModal = () => {
    const { reportingForm } = this.state;
    if (reportingForm) {
      return this.setState({ reportingForm: false });
    }
    return this.setState({ reportingForm: true, displayModal: false });
  };

  onEnterPress = e => {
    const { onCreateComments, commentBody } = this.props;
    if (e.keyCode === 13 && e.shiftKey === false && commentBody) {
      e.preventDefault();
      const { slug } = this.state;
      onCreateComments(commentBody, slug);
    }
  };

  handleScroll = () => {
    const { loading } = this.props;
    if (isBottom() && !loading) {
      const { page } = this.state;
      this.setState({ page: page + 1 });
      this.getMoreArticles();
    }
  };

  editComment = id => {
    const {
      onUpdateComment,
      updatedBody,
      match: {
        params: { slug }
      }
    } = this.props;
    onUpdateComment({ comments: updatedBody, commentId: id }, slug);
  };

  handleLikeComment = id => {
    const {
      onLikeComment,
      match: {
        params: { slug }
      }
    } = this.props;
    onLikeComment(id, slug);
  };

  deleteComment = id => {
    const {
      onDeleteComment,
      match: {
        params: { slug }
      }
    } = this.props;
    onDeleteComment(id, slug);
  };

  handleCommentsInputEdit = ({ target: { name, value } }) => {
    const { onHandleCommentsInputEdit } = this.props;
    onHandleCommentsInputEdit({ field: name, value });
  };

  handleCommentsInput = ({ target: { name, value } }) => {
    const { onHandleCommentsInput } = this.props;
    onHandleCommentsInput({ field: name, value }).then(() => {
      const { commentBody } = this.props;
      if (commentBody) {
        this.setState({ isCommentEmpty: false });
      } else {
        this.setState({ isCommentEmpty: true });
      }
    });
  };

  handleSubmitComment = e => {
    e.preventDefault();
    const { onCreateComments, commentBody } = this.props;
    const { slug } = this.state;
    onCreateComments(commentBody, slug);
  };

  redirectToEdit = () => {
    const { slug } = this.state;
    const {
      history: { push }
    } = this.props;
    push(`/articles/${slug}/edit`);
  };

  handleDeleteArticle = () => {
    const { deleteOneArticle, history } = this.props;
    const { slug } = this.state;
    deleteOneArticle(slug).then(response => {
      if (response.status === 200) {
        this.setState({ response: "Article deleted successfully" });
        return setTimeout(() => history.push("/"), 3000);
      }
    });
  };

  followAuthor = username => {
    const { followUser: followOther, history, location } = this.props;
    followOther(username, { history, location });
  };

  render() {
    const {
      response,
      slug,
      displayModal,
      reportingForm,
      isCommentEmpty,
      top,
      left,
      commentModelOpen
    } = this.state;
    const {
      article,
      asideArticles,
      currentUser,
      rate,
      history,
      reportArticle,
      commentBody,
      comments,
      updatedBody,
      onSetBodyEdit,
      loading,
      highlights,
      following: followObject,
      fetchRatings,
      rateArticle
    } = this.props;

    const { isFetching, message, article: retrievedArticle } = article;
    let author,
      body,
      title,
      tagsList,
      username,
      createdAt,
      readTime,
      image,
      firstName,
      lastName,
      isBookmarked,
      following;
    if (retrievedArticle) {
      ({
        author,
        body,
        title,
        tagsList,
        createdAt,
        readTime,
        bookmarked: isBookmarked
      } = retrievedArticle);
      ({ username, firstName, following, lastName, image } = author);
    }
    const isAuthor = isCurrentUserAuthor(username, currentUser);
    const {
      location: { host, pathname }
    } = window;
    const currentUrl = `${host}${pathname}`;
    if (typeof followObject.status === "boolean") {
      following = followObject.status;
    }
    return (
      <div>
        {message && message !== "Article found successfully" ? (
          <p className="success-message">{history.push("/not_found")}</p>
        ) : (
          <p>{response}</p>
        )}
        {!isFetching && retrievedArticle ? (
          <div className="article-container">
            <article className="article">
              <div className="article-author">
                <div className="avatar-wrapper">
                  <img
                    src={image || authorImage}
                    alt="Avatar"
                    className="avatar"
                  />
                  <div className="name_minutes">
                    <span className="author_name">
                      {username && firstName && lastName
                        ? `${firstName} ${lastName}`
                        : username}
                    </span>
                    <br />
                    <span className="date_read_time">
                      {calculateTimeStamp(createdAt)}, {readTime}min read
                    </span>
                  </div>
                </div>
                {isAuthor ? (
                  ""
                ) : (
                  <button
                    className={following ? "focus" : "author-follow"}
                    style={{
                      cursor: followObject.isFetching ? "progress" : "pointer"
                    }}
                    type="button"
                    disabled={followObject.isFetching}
                    onClick={() => this.followAuthor(username)}
                    data-test="follow_author"
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                )}
              </div>
              <div className="article-content">
                <div className="article-title">{title}</div>
                <section
                  className="article-text"
                  onMouseUp={this.handleHighlight}
                  onMouseMove={this.handleHighlight}
                  ref={this.setArticleBodyRef}
                  id="article-body"
                  test-data="article-body"
                >
                  {
                    stringToHtmlElement(markUserHighlight(body, highlights))
                      .body
                  }
                  <HighlighPopover
                    top={top}
                    left={left}
                    onClick={() => this.markHighlightText(false, "withComment")}
                    onHighlight={() => this.markHighlightText(true)}
                    data-test="selection-popover"
                  />
                </section>
                {isAuthor ? (
                  <div>
                    <Button
                      id="delete-btn"
                      className="btn delete_article"
                      onClick={this.handleDeleteArticle}
                      title="Delete"
                      data-test="delete_article"
                    />
                    <Button
                      className="btn edit_article"
                      onClick={this.redirectToEdit}
                      title="Edit"
                    />{" "}
                  </div>
                ) : (
                  ""
                )}

                <div className="tags">
                  {!isFetching && tagsList.length
                    ? tagsList.map(tag => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))
                    : ""}
                </div>
                <hr className="line__title" />
                <div className="article-comments">
                  <div className="article-comments--new">
                    <div className="avatar-wrapper comment-avatar-wrapper">
                      <img
                        src={image || authorImage}
                        alt="Avatar"
                        className="avatar"
                      />
                    </div>
                    <Textarea
                      className="comment-textarea"
                      type="textarea"
                      placeholder="Add a comment"
                      onChange={this.handleCommentsInput}
                      onKeyDown={e => this.onEnterPress(e)}
                      name="body"
                      value={commentBody}
                      data-test="comment-textarea"
                    />
                    <Button
                      className="btn delete_article"
                      onClick={this.handleSubmitComment}
                      title="Post"
                      disabled={isCommentEmpty}
                    />
                  </div>
                  <Comments
                    comments={comments}
                    updatedBody={updatedBody}
                    onSetBodyEdit={onSetBodyEdit}
                    deleteComment={this.deleteComment}
                    editComment={this.editComment}
                    handleCommentsInputEdit={this.handleCommentsInputEdit}
                    likeComment={this.handleLikeComment}
                    currentUser={currentUser}
                  />
                </div>
              </div>
              <div className="loading-comment">
                {loading ? <Loading /> : ""}
              </div>
            </article>
            <aside className="article-share">
              <div className="share-icons">
                <img className="share-icon" src={thumbsUp} alt="logo" />
                <img className="share-icon" src={dislikeIcon} alt="logo" />
                <Bookmark slug={slug} isBookmarked={isBookmarked} />
                <ShareIcon
                  image={facebookIcon}
                  href={`https://www.facebook.com/sharer/sharer.php?&u=${currentUrl}`}
                />
                <ShareIcon
                  image={twitterIcon}
                  href={`//twitter.com/share?url=${currentUrl}&text=${currentUrl}&hashtags=authorsHeaven,software development`}
                />
                <ShareIcon
                  image={emailIcon}
                  href={`mailto:?subject=Sharing the inspiring article&body=${currentUrl}`}
                />
                <RatingForm
                  fetchRatings={fetchRatings}
                  rate={rate}
                  rateArticle={rateArticle}
                  slug={slug}
                />
                <img
                  className="share-icon"
                  src={moreIcon}
                  alt="logo"
                  onClick={this.toggleReactionsModal}
                />
              </div>
              {displayModal ? (
                <div className="popup__report" ref={this.setWrapperRef}>
                  <div>
                    <p onClick={this.toggleReportingModal}>Report </p>
                    <hr />
                    <p>Rate</p>
                    <hr />
                  </div>
                </div>
              ) : (
                ""
              )}
            </aside>
            {reportingForm ? (
              <ReportingForm
                reportArticle={reportArticle}
                slug={retrievedArticle.slug}
                cancelReport={this.toggleReportingModal}
              />
            ) : (
              ""
            )}
            <div className="right article-others">
              <div className="right">
                {Object.values(asideArticles).length
                  ? Object.values(asideArticles).map(asideArticle => (
                      <div
                        className="article-card article-other"
                        key={asideArticle.slug}
                      >
                        <MainArticle article={asideArticle} />
                      </div>
                    ))
                  : ""}
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
        {retrievedArticle ? (
          <CommentModel
            isOpen={commentModelOpen}
            onClose={() =>
              this.setState({
                commentModelOpen: false
              })
            }
            id="comment-model"
            slug={retrievedArticle.slug}
          />
        ) : (
          ""
        )}
      </div>
    );
  }
}

Article.propTypes = {
  onLikeComment: PropTypes.func.isRequired,
  profile: PropTypes.shape({}).isRequired,
  loading: PropTypes.func.isRequired,
  onSetBodyEdit: PropTypes.func.isRequired,
  comments: PropTypes.shape({}).isRequired,
  onFetchComments: PropTypes.func.isRequired,
  updatedBody: PropTypes.string.isRequired,
  onUpdateComment: PropTypes.func.isRequired,
  onHandleCommentsInputEdit: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
  commentBody: PropTypes.string.isRequired,
  onHandleCommentsInput: PropTypes.func.isRequired,
  onCreateComments: PropTypes.func.isRequired,
  fetchOneArticle: PropTypes.func.isRequired,
  reportArticle: PropTypes.func.isRequired,
  deleteOneArticle: PropTypes.func.isRequired,
  markHighlight: PropTypes.func,
  fetchHighLights: PropTypes.func,
  highlights: PropTypes.shape({}),
  rate: PropTypes.shape({}).isRequired,
  fetchRatings: PropTypes.func.isRequired,
  rateArticle: PropTypes.func.isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  currentUser: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    image: PropTypes.string,
    username: PropTypes.string
  }).isRequired,
  article: PropTypes.shape({
    article: PropTypes.shape({
      author: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        image: PropTypes.string,
        username: PropTypes.string
      }),
      body: PropTypes.string,
      title: PropTypes.string,
      tagsList: PropTypes.arrayOf(PropTypes.string),
      comments: PropTypes.arrayOf(
        PropTypes.shape({
          author: PropTypes.shape({
            firstName: PropTypes.string,
            lastName: PropTypes.string,
            image: PropTypes.string,
            username: PropTypes.string
          }),
          body: PropTypes.string,
          like: PropTypes.number,
          id: PropTypes.string
        })
      ),
      createdAt: PropTypes.string,
      readTime: PropTypes.number
    })
  }).isRequired,
  asideArticles: PropTypes.arrayOf(
    PropTypes.shape({
      article: PropTypes.shape({
        article: PropTypes.shape({
          author: PropTypes.shape({
            firstName: PropTypes.string,
            lastName: PropTypes.string,
            image: PropTypes.string,
            username: PropTypes.string
          }),
          body: PropTypes.string,
          title: PropTypes.string,
          tagsList: PropTypes.arrayOf(PropTypes.string),
          comments: PropTypes.arrayOf(
            PropTypes.shape({
              author: PropTypes.shape({
                firstName: PropTypes.string,
                lastName: PropTypes.string,
                image: PropTypes.string,
                username: PropTypes.string
              }),
              body: PropTypes.string,
              like: PropTypes.number,
              id: PropTypes.string
            })
          ),
          createdAt: PropTypes.string,
          readTime: PropTypes.string
        })
      })
    })
  ).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      slug: PropTypes.string
    })
  }).isRequired,
  followUser: PropTypes.func.isRequired,
  following: PropTypes.bool.isRequired,
  location: PropTypes.shape([]).isRequired
};

Article.defaultProps = {
  markHighlight: () => "",
  fetchHighLights: () => "",
  highlights: {
    articleHighlights: {}
  }
};

Article.defaultProps = {
  markHighlight: () => "",
  fetchHighLights: () => "",
  highlights: {}
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Article)
);
