package com.streamx.app

import android.content.Context
import android.net.Uri
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.room.*
import coil.compose.AsyncImage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

// ==============================================================================
// 1. DATA MODELS
// ==============================================================================

data class Episode(
    val id: String,
    val episodeNumber: Int,
    val title: String,
    val duration: String,
    val durationSeconds: Long,
    val videoUrl: String,
    val thumbnailUrl: String,
    val description: String = ""
)

data class Season(
    val seasonNumber: Int,
    val title: String,
    val episodes: List<Episode>
)

data class Series(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val rating: String,
    val posterUrl: String,
    val bannerUrl: String,
    val seasons: List<Season>
)

// ==============================================================================
// 2. ROOM DATABASE FOR WATCH HISTORY
// ==============================================================================

@Entity(tableName = "watch_history", primaryKeys = ["seriesId", "seasonNum", "episodeNum"])
data class WatchHistoryEntity(
    val seriesId: String,
    val seasonNum: Int,
    val episodeNum: Int,
    val seriesTitle: String,
    val episodeTitle: String,
    val timestamp: Long = System.currentTimeMillis(),
    val progressSeconds: Long = 0L,
    val isWatched: Boolean = true
)

@Dao
interface WatchHistoryDao {
    @Query("SELECT * FROM watch_history WHERE seriesId = :seriesId")
    fun getWatchHistoryForSeries(seriesId: String): Flow<List<WatchHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateHistory(item: WatchHistoryEntity)

    @Query("SELECT EXISTS(SELECT 1 FROM watch_history WHERE seriesId = :seriesId AND seasonNum = :seasonNum AND episodeNum = :episodeNum AND isWatched = 1)")
    suspend fun isEpisodeWatched(seriesId: String, seasonNum: Int, episodeNum: Int): Boolean
}

@Database(entities = [WatchHistoryEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun watchHistoryDao(): WatchHistoryDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "streamx_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}

// ==============================================================================
// 3. INLINE VIDEO PLAYER & SERIES DETAIL SCREEN (YOUTUBE-STYLE)
// ==============================================================================

@Composable
fun SeriesDetailScreen(
    series: Series,
    onBackClicked: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val db = remember { AppDatabase.getDatabase(context) }
    val watchHistoryDao = remember { db.watchHistoryDao() }

    // Observe watched episodes from Room DB
    val watchHistoryList by watchHistoryDao.getWatchHistoryForSeries(series.id)
        .collectAsState(initial = emptyList())

    val watchedEpisodeSet = remember(watchHistoryList) {
        watchHistoryList.filter { it.isWatched }.map { "${it.seasonNum}_${it.episodeNum}" }.toSet()
    }

    // Active Season State
    var selectedSeasonNum by remember { mutableIntStateOf(1) }
    val currentSeason = remember(series, selectedSeasonNum) {
        series.seasons.find { it.seasonNumber == selectedSeasonNum } ?: series.seasons.firstOrNull()
    }

    // Current Playing Episode (null = show Series Poster; non-null = inline ExoPlayer)
    var currentPlayingEpisode by remember { mutableStateOf<Episode?>(null) }

    // ExoPlayer Media3 Instance
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            playWhenReady = true
        }
    }

    // Release player on Dispose
    DisposableEffect(exoPlayer) {
        onDispose {
            exoPlayer.release()
        }
    }

    // Play Episode function
    fun playEpisode(episode: Episode, seasonNum: Int) {
        currentPlayingEpisode = episode
        selectedSeasonNum = seasonNum

        // Setup ExoPlayer MediaItem
        val mediaItem = MediaItem.fromUri(Uri.parse(episode.videoUrl))
        exoPlayer.setMediaItem(mediaItem)
        exoPlayer.prepare()
        exoPlayer.play()

        // Save exact episode played to Room DB watch history
        coroutineScope.launch {
            watchHistoryDao.insertOrUpdateHistory(
                WatchHistoryEntity(
                    seriesId = series.id,
                    seasonNum = seasonNum,
                    episodeNum = episode.episodeNumber,
                    seriesTitle = series.title,
                    episodeTitle = episode.title,
                    timestamp = System.currentTimeMillis(),
                    isWatched = true
                )
            )
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF090A0F))
            .verticalScroll(rememberScrollState())
    ) {
        // ======================================================================
        // TOP HALF: Series Poster by default; Replaced by 16:9 inline ExoPlayer
        // ======================================================================
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
                .background(Color.Black)
        ) {
            if (currentPlayingEpisode != null) {
                // 16:9 Inline ExoPlayer (Media3)
                AndroidView(
                    factory = { ctx ->
                        PlayerView(ctx).apply {
                            player = exoPlayer
                            useController = true
                            layoutParams = FrameLayout.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                // Series Poster by Default
                AsyncImage(
                    model = series.bannerUrl.ifEmpty { series.posterUrl },
                    contentDescription = series.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // Top Vignette Gradients
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.7f),
                                    Color.Transparent,
                                    Color(0xFF090A0F)
                                )
                            )
                        )
                )

                // Center Play Button to play S1:E1 directly
                IconButton(
                    onClick = {
                        val firstEp = currentSeason?.episodes?.firstOrNull()
                        if (firstEp != null) {
                            playEpisode(firstEp, selectedSeasonNum)
                        }
                    },
                    modifier = Modifier
                        .align(Alignment.Center)
                        .size(56.dp)
                        .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(28.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Play First Episode",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            // Top-left Back Button
            IconButton(
                onClick = onBackClicked,
                modifier = Modifier
                    .padding(12.dp)
                    .align(Alignment.TopStart)
                    .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(20.dp))
            ) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }
        }

        // Currently playing episode title below the video (YouTube-Style)
        if (currentPlayingEpisode != null) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF10121A))
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Text(
                    text = "NOW PLAYING • S${selectedSeasonNum}:E${currentPlayingEpisode?.episodeNumber}",
                    color = MaterialTheme.colorScheme.primary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = currentPlayingEpisode?.title.orEmpty(),
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        // Series Title and Description Header
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = series.title,
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = series.description,
                color = Color(0xFF94A3B8),
                fontSize = 13.sp,
                lineHeight = 18.sp
            )
        }

        Divider(color = Color(0xFF1E293B), thickness = 1.dp)

        // ======================================================================
        // BOTTOM HALF: Scrollable Tabs for Seasons
        // ======================================================================
        Column(modifier = Modifier.padding(top = 12.dp)) {
            Text(
                text = "SELECT SEASON",
                color = Color(0xFF64748B),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            // Scrollable Tabs for Seasons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                series.seasons.forEach { season ->
                    val isSelected = season.seasonNumber == selectedSeasonNum
                    val tabBgColor = if (isSelected) MaterialTheme.colorScheme.primary else Color(0xFF1E293B)
                    val tabTextColor = if (isSelected) Color.White else Color(0xFF94A3B8)

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(tabBgColor)
                            .clickable { selectedSeasonNum = season.seasonNumber }
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Season ${season.seasonNumber}",
                            color = tabTextColor,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // ======================================================================
        // EPISODE GRID OF SQUARE BOXES ("E1", "E2")
        // ======================================================================
        val episodes = currentSeason?.episodes.orEmpty()
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "EPISODES (${episodes.size})",
                color = Color(0xFF64748B),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // Grid of Small Square Boxes
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 44.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 400.dp)
            ) {
                items(episodes, key = { it.id }) { ep ->
                    val isCurrentlyPlaying = currentPlayingEpisode?.id == ep.id &&
                            selectedSeasonNum == currentSeason?.seasonNumber

                    val isWatched = watchedEpisodeSet.contains("${currentSeason?.seasonNumber}_${ep.episodeNumber}")

                    // Background and Border Styling:
                    // 1. Currently Playing -> Highlight with Primary Color
                    // 2. Watched in Room DB -> Tint background (Subtle Rosy Dark Tint)
                    // 3. Default -> Slate dark box
                    val boxBgColor = when {
                        isCurrentlyPlaying -> MaterialTheme.colorScheme.primary
                        isWatched -> Color(0xFF4C0519) // Tinted background for watched episodes
                        else -> Color(0xFF1E293B)
                    }

                    val borderColor = when {
                        isCurrentlyPlaying -> Color.White
                        isWatched -> Color(0xFFF43F5E).copy(alpha = 0.6f)
                        else -> Color(0xFF334155)
                    }

                    val textColor = when {
                        isCurrentlyPlaying -> Color.White
                        isWatched -> Color(0xFFFECDD3)
                        else -> Color(0xFFE2E8F0)
                    }

                    Box(
                        modifier = Modifier
                            .aspectRatio(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(boxBgColor)
                            .border(
                                width = if (isCurrentlyPlaying) 2.dp else 1.dp,
                                color = borderColor,
                                shape = RoundedCornerShape(8.dp)
                            )
                            .clickable {
                                playEpisode(ep, selectedSeasonNum)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "E${ep.episodeNumber}",
                            color = textColor,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black
                        )

                        // Watched checkmark badge
                        if (isWatched && !isCurrentlyPlaying) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Watched",
                                tint = Color(0xFFF43F5E),
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(2.dp)
                                    .size(10.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
